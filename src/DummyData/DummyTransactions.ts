import { v4 as uuidv4 } from "uuid";

export const createDummyTransactions = (days = 30) => {
  const transactions = [];

  for (let dayOffset = 0; dayOffset < days; dayOffset++) {
    const baseDate = new Date();
    baseDate.setDate(baseDate.getDate() - dayOffset);
    baseDate.setHours(0, 0, 0, 0); // Start of the day

    for (let i = 0; i < 30; i++) {
      const timestamp = new Date(baseDate);
      timestamp.setMinutes(i * 30); // Spread transactions across the day

      const transaction = {
        transaction_id: uuidv4(),
        buyer_id: `buyer_${Math.floor(Math.random() * 1000)}`,
        seller_id: `seller_${Math.floor(Math.random() * 1000)}`,
        quantity_kwh: parseFloat((Math.random() * 100 + 10).toFixed(2)),
        agreed_price_per_kwh: parseFloat((Math.random() * 5 + 0.5).toFixed(2)),
        trade_status: ["initiated", "pending", "completed", "cancelled"][
          Math.floor(Math.random() * 4)
        ] as any,
        smart_contract_address: `0x${Math.random().toString(16).substring(2, 42)}`,
        blockchain_tx_hash: `0x${Math.random().toString(16).substring(2, 66)}`,
        region: ["North", "South", "East", "West"][
          Math.floor(Math.random() * 4)
        ],
        energy_type: ["solar", "wind", "hydro", "other"][
          Math.floor(Math.random() * 4)
        ] as any,
        payment_status: ["unpaid", "partial", "paid", "failed"][
          Math.floor(Math.random() * 4)
        ] as any,
        createdAt: timestamp,
        updatedAt: timestamp,
      };

      transactions.push(transaction);
    }
  }

  return transactions.reverse();
};
