export const DirectArbitrageTraderABI = [
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: '_from',
        type: 'address'
      },
      {
        indexed: true,
        internalType: 'address',
        name: '_to',
        type: 'address'
      }
    ],
    name: 'OwnershipTransferred',
    type: 'event'
  },
  {
    inputs: [],
    name: 'acceptOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [],
    name: 'newOwner',
    outputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'owner',
    outputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: '_newOwner',
        type: 'address'
      }
    ],
    name: 'transferOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'inputAmount',
        type: 'uint256'
      },
      {
        internalType: 'uint256',
        name: 'expectedOutputAmount',
        type: 'uint256'
      },
      {
        internalType: 'address',
        name: 'ex0Router',
        type: 'address'
      },
      {
        internalType: 'address[]',
        name: 'ex0Path',
        type: 'address[]'
      },
      {
        internalType: 'address',
        name: 'ex1Router',
        type: 'address'
      },
      {
        internalType: 'address[]',
        name: 'ex1Path',
        type: 'address[]'
      },
      {
        internalType: 'uint256',
        name: 'deadline',
        type: 'uint256'
      }
    ],
    name: 'trade',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256'
      }
    ],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'tokenAddress',
        type: 'address'
      },
      {
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256'
      }
    ],
    name: 'withdrawToken',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  }
]
