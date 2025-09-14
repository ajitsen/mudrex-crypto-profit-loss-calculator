// This file contains the main JavaScript logic for the Mudrex Crypto Profit/Loss Calculator application.
// It handles user interactions, processes input data, and manages the calculation of profits and losses from Virtual Digital Assets (VDA).

document.addEventListener('DOMContentLoaded', () => {
    const usdInrRateInput = document.getElementById('usdInrRate');
    const cutoffDateInput = document.getElementById('cutoffDate');
    const fileInput = document.getElementById('fileInput');
    const outputDiv = document.getElementById('output');
    const sortedDiv = document.getElementById('sorted');
    const sortedDownloadBtn = document.getElementById('sortedDownloadBtn');
    const vdaDownloadBtn = document.getElementById('vdaDownloadBtn');

    // Enable button only if both inputs are set
    let pending = true;
    function updateGenerateBtnState() {
        const rate = document.getElementById('usdInrRate').value;
        const file = document.getElementById('fileInput').files.length;
        const cutoff = document.getElementById('cutoffDate').value;
        if (rate && file && cutoff && pending) {
            console.log('Processing file...');
            processFile();
            pending = false;
         } else {
            pending = true;
         }
    }

    document.getElementById('usdInrRate').addEventListener('input', updateGenerateBtnState);
    document.getElementById('fileInput').addEventListener('change', updateGenerateBtnState);
    document.getElementById('cutoffDate').addEventListener('input', updateGenerateBtnState);

    function parseTSV(tsv) {
        const lines = tsv.trim().split('\n');
        const headers = lines[0].split('\t');
        return lines.slice(1).map(line => {
            const cols = line.split('\t');
            const obj = {};
            headers.forEach((h, i) => obj[h.trim()] = cols[i].trim());
            return obj;
        });
    }

    /**
     * Main: Processes the uploaded TSV file, sorts transactions by date, calculates profit/loss,
     * and displays the results in a table.
     */ 
    function processFile() {
        clearTicks();
        const fileInput = document.getElementById('fileInput');
        if (!fileInput.files.length) {
            alert('Please select a TSV file.');
            return;
        }
        const file = fileInput.files[0];
        const reader = new FileReader();
        reader.onload = function(e) {
            const tsv = e.target.result;
            const transactions = parseTSV(tsv);
            const sorted = getSortedTransactions(transactions);
            const sortedCsv = showSortedTransactions(sorted, 'sorted');
            setupDownload('sortedDownloadBtn', sortedCsv, 'sorted-transactions.csv');
            const result = calculateProfitLoss(sorted);
            showTable(result.rows, 'output');
            setupDownload('vdaDownloadBtn', result.csv, 'income-from-vda-profit.csv');
            showTick();
        };
        reader.readAsText(file);
    }

    function getSortedTransactions(transactions) {
        const coins = {};
        transactions.forEach(tx => {
            const symbol = tx['Symbol'];
            if (!coins[symbol]) coins[symbol] = [];
            coins[symbol].push(tx);
        });
        Object.keys(coins).forEach(symbol => {
            coins[symbol] = coins[symbol].sort((a, b) => new Date(a['Date (IST)']) - new Date(b['Date (IST)']));
        });
        return coins;
    }

    function showSortedTransactions(sortedCoins, htmlId) {
        const output = document.getElementById(htmlId);
        let html = '';
        let columns = ['Symbol', 'Date (IST)', 'Transaction Type', 'Coin Quantity', 'Amount (USDT)'];
        let csvRows = [];
        if (Object.keys(sortedCoins).length === 0) {
            html += '<b>No transactions found.</b>';
            output.innerHTML = html;
            return;
        } else if (Object.keys(sortedCoins).length) {
            html += '<table><tr>';
            html += '<tr>';
            const csvCols = [];
            for (let col of columns) {
                html += `<th>${col}</th>`;
                csvCols.push(col.replace(/,/g, ' '));
            }
            html += '</tr>';
            csvRows.push([...csvCols].join(','));
        }
        Object.keys(sortedCoins).forEach(symbol => {
            sortedCoins[symbol].forEach(tx => {
                html += '<tr>';
                const csvCols = [];
                for (let col of columns) {
                    html += `<td>${tx[col]}</td>`;
                    csvCols.push(tx[col].replace(/,/g, ' '));
                }
                html += '</tr>';
                csvRows.push([...csvCols].join(','));
            });
        });
        if (Object.keys(sortedCoins).length) {
            html += '</table>';
        }
        output.innerHTML = html;
        return csvRows.join('\n');
    }

    function getDateString(date) {
        const d = new Date(date);
        return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
    }

    function isDateAfter(date1, date2) {
        // Compare only date part (ignore time)
        const d1 = new Date(date1);
        const d2 = new Date(date2);
        // Set both to midnight for accurate date-only comparison
        d1.setHours(0,0,0,0);
        d2.setHours(0,0,0,0);
        return d1 > d2;
    }

    /**
     * Calculates profit/loss for each transaction, considering buy/sell pairs.
     * Returns an object with CSV rows and HTML table rows.
     */
    function calculateProfitLoss(sortedCoins) {
        let serialNo = 1;
        let csvRows = ['Sl. No.,Date of Acquisition,Date of Transfer,Head under which income to be taxed (Capital Gain),Cost of Acquisition,Consideration Received,Income from transfer of Virtual Digital Assets'];
        let tableRows = [];
        const usdInrRate = parseFloat(document.getElementById('usdInrRate').value) || 1;
        const cutoffDate = document.getElementById('cutoffDate').value;
        Object.keys(sortedCoins).forEach(symbol => {
            const txs = sortedCoins[symbol]; // Already sorted
            let buys = [];
            txs.forEach(tx => {
                const type = tx['Transaction Type'].toUpperCase();
                const qty = parseFloat(tx['Coin Quantity']);
                const amt = parseFloat(tx['Amount (USDT)']);
                const date = getDateString(tx['Date (IST)']);
                const isDateFY = isDateAfter(tx['Date (IST)'], cutoffDate);
                if (['BUY', 'BUYTHEDIP', 'CREDIT'].includes(type)) {
                    buys.push({ qty, amt, date });
                } else if (['SELL', 'TAKEPROFIT'].includes(type)) {
                    let sellQty = qty;
                    while (sellQty > 0 && buys.length) {
                        let buy = buys[0];
                        let usedQty = Math.min(sellQty, buy.qty);
                        const buyAmtPerUnit = buy.amt / buy.qty;
                        const costBasis = buyAmtPerUnit * usedQty * usdInrRate;
                        const sellBasis = (amt / qty) * usedQty * usdInrRate;
                        buy.qty -= usedQty;
                        buy.amt -= buyAmtPerUnit * usedQty;
                        sellQty -= usedQty;
                        if (buy.qty <= 0 || sellQty <= 0) {
                            if (isDateFY) {
                                let profitLoss = sellBasis - costBasis;
                                const profitLossCsv = profitLoss > 0 ? profitLoss.toFixed(2) : '0';
                                csvRows.push(`${serialNo},${buy.date},${date},Capital Gain,${costBasis.toFixed(2)},${sellBasis.toFixed(2)},${profitLossCsv}`);
                                tableRows.push([symbol,serialNo++, buy.date, date, type, usedQty.toFixed(6), costBasis.toFixed(2), sellBasis.toFixed(2), profitLoss.toFixed(2), '-']);
                            }
                            if (buy.qty === 0) {
                                buys.shift();
                            }
                        } 
                    }
                    let buyShortfall = '-';
                    if (sellQty > 0.00001 && isDateFY) {
                        buyShortfall=`Missing buy ${sellQty} units for this sell transaction. Please check your data.`;
                        const sellAmount = (amt / qty) * sellQty * usdInrRate;
                        csvRows.push(`${serialNo},-,${date},Capital Gain,-,${sellAmount.toFixed(2)},-`);
                        tableRows.push([symbol,serialNo++, '-', date, type, sellQty, '-', sellAmount.toFixed(2), '-', buyShortfall]);
                    }
                }
            });
        });
        return { csv: csvRows.join('\n'), rows: tableRows };
    }

    function showTable(rows, htmlId) {
        const output = document.getElementById(htmlId);
        if (!rows.length) {
            output.innerHTML = '<b>No SELL transactions found.</b>';
            document.getElementsByClassName('btn').disabled = true;
            // Also clear subheading if no rows
            if (htmlId === 'output') {
                document.getElementById('profitLossSubheading').innerHTML = '';
            }
            return;
        }
        // Show subheading for start date of sell
        if (htmlId === 'output') {
            const cutoff = document.getElementById('cutoffDate').value;
            let formatted = '';
            if (cutoff) {
                const d = new Date(cutoff);
                formatted = d.toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });
            }
            document.getElementById('profitLossSubheading').innerHTML = 
                `Start Date of Sell Transactions (for FY): <span style="color:#007bff">${formatted || cutoff}</span>`;
        }
        let html = '<table><tr><th>Coin</th><th>Sl.No.</th><th>Buy Date</th><th>Sell Date</th><th>Type</th><th>Quantity</th><th>Cost Basis (INR)</th><th>Sell Amount (INR)</th><th>Profit/Loss (INR)</th><th>Buy Shortfall</th></tr>';
        rows.forEach(r => {
            html += `<tr>${r.map(x => `<td>${x}</td>`).join('')}</tr>`;
        });
        html += '</table>';
        output.innerHTML = html;
    }

    function setupDownload(id, csv, filename) {
        document.getElementById(id).onclick = function() {
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        };
        document.getElementById(id).disabled = false;
    }

    function showTick(className = 'tick') {
        Array.from(document.getElementsByClassName(className)).forEach(e => {
            e.innerHTML = '(Ready ✅)';
            e.classList.add('show');
        });
    }

    function clearTicks(className = 'tick') {
        Array.from(document.getElementsByClassName(className)).forEach(e => {
            e.innerHTML = '';
            e.classList.remove('show');
        });
    }
});