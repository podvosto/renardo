export const ArbitrageTraderABI = [
  {
    inputs: [],
    name: 'getMessage',
    outputs: [
      {
        internalType: 'string',
        name: '',
        type: 'string'
      }
    ],
    stateMutability: 'view',
    type: 'function',
    constant: true
  },
  {
    inputs: [
      {
        internalType: 'string',
        name: 'newMessage',
        type: 'string'
      }
    ],
    name: 'setMessage',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  }
]
