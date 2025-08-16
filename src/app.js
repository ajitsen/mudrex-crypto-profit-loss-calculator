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

    let pending = true;

    function updateGenerateBtnState() {
        const rate = usdInrRateInput.value;
        const file = fileInput.files.length;
        const cutoff = cutoffDateInput.value;
        if (rate && file && cutoff && pending) {
            processFile();
            pending = false;
        } else {
            pending = true;
        }
    }

    usdInrRateInput.addEventListener('input', updateGenerateBtnState);
    fileInput.addEventListener('change', updateGenerateBtnState);
    cutoffDateInput.addEventListener('input', updateGenerateBtnState);

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

    function processFile() {
        clearTicks();
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

    function showTable(rows, htmlId) {
        const output = document.getElementById(htmlId);
        if (!rows.length) {
            output.innerHTML = '<b>No SELL transactions found.</b>';
            document.getElementsByClassName('btn').disabled = true;
            return;
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
        Array.from(document.getElementsByClassName(className)).forEach(e => e.innerHTML = '✅');
    }

    function clearTicks(className = 'tick') {
        Array.from(document.getElementsByClassName(className)).forEach(e => e.innerHTML = '');
    }
});