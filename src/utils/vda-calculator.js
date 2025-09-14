function parseTransactionData(tsv) {
    const lines = tsv.trim().split('\n');
    const headers = lines[0].split('\t');
    return lines.slice(1).map(line => {
        const cols = line.split('\t');
        const obj = {};
        headers.forEach((header, index) => obj[header.trim()] = cols[index].trim());
        return obj;
    });
}

function calculateProfitLoss(transactions, usdInrRate, cutoffDate) {
    let results = [];
    let serialNo = 1;

    const groupedTransactions = groupTransactionsBySymbol(transactions);

    Object.keys(groupedTransactions).forEach(symbol => {
        const txs = groupedTransactions[symbol];
        let buys = [];

        txs.forEach(tx => {
            const type = tx['Transaction Type'].toUpperCase();
            const qty = parseFloat(tx['Coin Quantity']);
            const amt = parseFloat(tx['Amount (USDT)']);
            const date = new Date(tx['Date (IST)']);
            const isDateFY = date > new Date(cutoffDate);

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

                    if (buy.qty <= 0) {
                        buys.shift();
                    }

                    if (isDateFY) {
                        results.push({
                            serialNo: serialNo++,
                            symbol,
                            buyDate: buy.date.toLocaleDateString(),
                            sellDate: date.toLocaleDateString(),
                            type,
                            quantity: usedQty.toFixed(6),
                            costBasis: costBasis.toFixed(2),
                            sellAmount: sellBasis.toFixed(2),
                            profitLoss: (sellBasis - costBasis).toFixed(2)
                        });
                    }
                }
            }
        });
    });

    return results;
}

function groupTransactionsBySymbol(transactions) {
    return transactions.reduce((acc, tx) => {
        const symbol = tx['Symbol'];
        if (!acc[symbol]) acc[symbol] = [];
        acc[symbol].push(tx);
        return acc;
    }, {});
}

function formatResultsForDisplay(results) {
    return results.map(result => {
        return `${result.serialNo}, ${result.symbol}, ${result.buyDate}, ${result.sellDate}, ${result.type}, ${result.quantity}, ${result.costBasis}, ${result.sellAmount}, ${result.profitLoss}`;
    });
}

export { parseTransactionData, calculateProfitLoss, formatResultsForDisplay };