export const ArbitrageTraderABI=[
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "inputAmount",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "expectedOutputAmount",
                "type": "uint256"
            },
            {
                "internalType": "address",
                "name": "ex0Router",
                "type": "address"
            },
            {
                "internalType": "address[]",
                "name": "ex0Path",
                "type": "address[]"
            },
            {
                "internalType": "address",
                "name": "ex1Router",
                "type": "address"
            },
            {
                "internalType": "address[]",
                "name": "ex1Path",
                "type": "address[]"
            },
            {
                "internalType": "uint256",
                "name": "deadline",
                "type": "uint256"
            }
        ],
        "name": "trade",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
    }
]