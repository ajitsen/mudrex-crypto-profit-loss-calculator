# Mudrex Crypto Profit/Loss Calculator

This project is a tool designed to help users of Mudrex generate income reports from the transfer of Virtual Digital Assets (VDA). It calculates profits and losses based on user-uploaded transaction data and provides a clear output for tax reporting purposes.

## Features

- Upload transaction data in TSV format.
- Calculate profit/loss for Virtual Digital Assets.
- Generate downloadable reports in CSV format.
- User-friendly interface for easy interaction.

## Project Structure

```
mudrex-crypto-profit-loss-calculator
├── src
│   ├── index.html        # Main HTML document
│   ├── app.js            # JavaScript logic for the application
│   ├── styles.css        # CSS styles for the application
│   └── utils
│       └── vda-calculator.js # Utility functions for VDA calculations
├── package.json          # npm configuration file
├── README.md             # Project documentation
└── LICENSE               # Licensing information
```

## Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/mudrex-crypto-profit-loss-calculator.git
   ```
2. Navigate to the project directory:
   ```
   cd mudrex-crypto-profit-loss-calculator
   ```
3. Install the dependencies:
   ```
   npm install
   ```

## Usage

1. Open `src/index.html` in your web browser.
2. Enter the required parameters:
   - USD to INR Rate
   - Start Date of Sell Transaction
   - Upload your Crypto Transactions TSV file.
3. Click on the "Calculate" button to process the data.
4. Download the generated reports in CSV format.

## Contributing

Contributions are welcome! Please follow these steps to contribute:

1. Fork the repository.
2. Create a new branch for your feature or bug fix:
   ```
   git checkout -b feature/YourFeature
   ```
3. Make your changes and commit them:
   ```
   git commit -m "Add your message here"
   ```
4. Push to the branch:
   ```
   git push origin feature/YourFeature
   ```
5. Create a pull request.

## License

This project is licensed under the MIT License. See the LICENSE file for details.