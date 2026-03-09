import type { Playbook } from '@/types/playbook'

export const OFFICIAL_PLAYBOOKS: Playbook[] = [
  {
    id: 'weekly-auto-saver',
    name: 'Weekly Auto-Saver',
    description: 'Every Friday, automatically saves a percentage of your USDT balance to a designated savings wallet.',
    icon: '🐖',
    category: 'savings',
    author: 'official',
    tags: ['savings', 'automated', 'friday', 'usdt'],
    uses: 842,
    systemPrompt: `You are a disciplined savings agent running on the Celo blockchain. Every Friday, you calculate {savings_percentage}% of the user's current USDT balance and transfer that amount to their savings address at {savings_address}.

Before each transfer, log the current balance, the calculated savings amount, and confirm the transaction hash. If the balance is below 1 USDT, skip the week and notify the user.

Send a friendly weekly summary to the user after each successful save, including their total saved to date. Encourage consistent saving behavior with brief motivational messages.`,
    variables: [
      { key: 'savings_address', label: 'Savings Wallet Address', type: 'address', placeholder: '0x...', required: true },
      { key: 'savings_percentage', label: 'Savings Percentage (%)', type: 'number', placeholder: '10', required: true },
    ],
    defaultSpendingLimit: 500,
    defaultModel: 'gpt-4o-mini',
    triggers: ['on_schedule'],
    requiredChannels: ['telegram'],
    celoFeatures: ['usdt_payments'],
  },
  {
    id: 'pay-on-command',
    name: 'Pay on Command',
    description: 'Send USDT payments instantly when an approved contact messages you a payment command.',
    icon: '💸',
    category: 'payments',
    author: 'official',
    tags: ['payments', 'telegram', 'on-demand', 'usdt'],
    uses: 1203,
    systemPrompt: `You are a payment execution agent on the Celo blockchain. You listen for payment commands from approved senders only. The approved senders are: {allowed_senders}.

When an approved contact sends a message like "pay [recipient] [amount]", confirm the request details, verify the recipient address {recipient_address}, and execute the USDT transfer.

Default payment amount is {default_amount} USDT if not specified. Always show the transaction fee estimate and require explicit confirmation ("yes" or "confirm") before executing. Log every transaction with hash and timestamp. Reject all requests from non-approved senders politely.`,
    variables: [
      { key: 'recipient_address', label: 'Default Recipient Address', type: 'address', placeholder: '0x...', required: true },
      { key: 'default_amount', label: 'Default Amount (USDT)', type: 'number', placeholder: '10', required: true },
      { key: 'allowed_senders', label: 'Approved Senders (comma-separated Telegram handles)', type: 'text', placeholder: '@alice, @bob', required: true },
    ],
    defaultSpendingLimit: 200,
    defaultModel: 'gpt-4o-mini',
    triggers: ['on_message'],
    requiredChannels: ['telegram'],
    celoFeatures: ['usdt_payments'],
  },
  {
    id: 'buy-the-dip',
    name: 'Buy the Dip',
    description: 'Monitors token prices on Celo DEXes and automatically buys when your target price is hit.',
    icon: '📉',
    category: 'trading',
    author: 'official',
    tags: ['trading', 'dca', 'price-alert', 'defi'],
    uses: 567,
    systemPrompt: `You are a disciplined DCA (dollar-cost averaging) trading agent on the Celo blockchain. Every hour, you check the current price of {token} against your target price of {price_threshold} USDT.

When the price drops at or below {price_threshold} USDT, execute a buy order using {buy_amount_usdt} USDT via the best available Celo DEX. Notify the user immediately after each purchase with the execution price, amount received, and transaction hash.

Never exceed {buy_amount_usdt} USDT per purchase. If a purchase fails, retry once and then alert the user. Keep a running log of all purchases for portfolio tracking. Do not panic-sell — you are a buyer only.`,
    variables: [
      { key: 'token', label: 'Token to Buy (e.g. CELO, cBTC)', type: 'text', placeholder: 'CELO', required: true },
      { key: 'price_threshold', label: 'Buy Price Threshold (USDT)', type: 'number', placeholder: '0.85', required: true },
      { key: 'buy_amount_usdt', label: 'Amount to Buy Per Dip (USDT)', type: 'number', placeholder: '25', required: true },
    ],
    defaultSpendingLimit: 300,
    defaultModel: 'gpt-4o-mini',
    triggers: ['on_schedule'],
    requiredChannels: ['telegram'],
    celoFeatures: ['usdt_payments', 'mento_swap'],
  },
  {
    id: 'group-bill-splitter',
    name: 'Group Bill Splitter',
    description: 'Listens in a Telegram group for "split $X" commands and automatically collects from each member in USDT.',
    icon: '🧾',
    category: 'payments',
    author: 'official',
    tags: ['payments', 'group', 'splitting', 'telegram'],
    uses: 389,
    systemPrompt: `You are a group bill-splitting agent for a Telegram group. Group members are: {group_members}. Your Telegram group ID is {telegram_group_id}.

When any member sends "split $[amount]" or "split [amount] USDT", calculate each person's equal share, then send individual payment requests to each member in the group. Track who has paid and who hasn't.

Send reminders to unpaid members every 2 hours. Once everyone has paid, confirm the split is complete and announce it in the group. If a member is unavailable, notify the organizer. All payments are in USDT on Celo.`,
    variables: [
      { key: 'group_members', label: 'Member Wallet Addresses (comma-separated)', type: 'text', placeholder: '0xAlice, 0xBob, 0xCarol', required: true },
      { key: 'telegram_group_id', label: 'Telegram Group ID', type: 'text', placeholder: '-100123456789', required: true },
    ],
    defaultSpendingLimit: 0,
    defaultModel: 'gpt-4o-mini',
    triggers: ['on_message'],
    requiredChannels: ['telegram'],
    celoFeatures: ['usdt_payments'],
  },
  {
    id: 'wallet-watchdog',
    name: 'Wallet Watchdog',
    description: 'Instantly notifies you on Telegram whenever your wallet receives funds above a set threshold.',
    icon: '🐕',
    category: 'utility',
    author: 'official',
    tags: ['monitoring', 'notifications', 'wallet', 'alerts'],
    uses: 2104,
    systemPrompt: `You are a wallet monitoring agent for the Celo blockchain. You watch for any incoming transactions to the user's wallet above {minimum_amount} USDT.

When a qualifying transaction is detected, immediately send a notification to {notify_channel} with: the sender address, amount received, transaction hash, and current wallet balance after receipt.

Format notifications clearly and include a Celo Explorer link for the transaction. If you detect multiple transactions within 1 minute, batch them into a single notification. Log all activity regardless of threshold for the user's records.`,
    variables: [
      { key: 'notify_channel', label: 'Telegram Channel or Chat ID', type: 'text', placeholder: '@mychannel or chat_id', required: true },
      { key: 'minimum_amount', label: 'Minimum Alert Amount (USDT)', type: 'number', placeholder: '5', required: true },
    ],
    defaultSpendingLimit: 0,
    defaultModel: 'gpt-4o-mini',
    triggers: ['on_payment_received'],
    requiredChannels: ['telegram'],
    celoFeatures: ['usdt_payments'],
  },
  {
    id: 'recurring-payment',
    name: 'Recurring Payment Bot',
    description: 'Sends a fixed USDT amount on your schedule — perfect for rent, subscriptions, and payroll.',
    icon: '🔁',
    category: 'payments',
    author: 'official',
    tags: ['payments', 'recurring', 'scheduled', 'payroll'],
    uses: 743,
    systemPrompt: `You are a recurring payment agent on the Celo blockchain. Your job is to send {amount_usdt} USDT to {recipient_address} on a {frequency} basis. This payment is labeled: "{label}".

Before each payment, verify the wallet has sufficient balance. Execute the transfer and log the transaction hash and timestamp. Notify the user on successful payment with a receipt.

If a payment fails due to insufficient funds, alert the user immediately and retry 24 hours later. Maintain a payment history log. Never skip a scheduled payment without notifying the user first.`,
    variables: [
      { key: 'recipient_address', label: 'Recipient Wallet Address', type: 'address', placeholder: '0x...', required: true },
      { key: 'amount_usdt', label: 'Payment Amount (USDT)', type: 'number', placeholder: '100', required: true },
      { key: 'frequency', label: 'Frequency', type: 'select', placeholder: 'weekly', required: true, options: ['daily', 'weekly', 'biweekly', 'monthly'] },
      { key: 'label', label: 'Payment Label', type: 'text', placeholder: 'Monthly rent', required: true },
    ],
    defaultSpendingLimit: 1000,
    defaultModel: 'gpt-4o-mini',
    triggers: ['on_schedule'],
    requiredChannels: [],
    celoFeatures: ['usdt_payments'],
  },
  {
    id: 'stablecoin-rebalancer',
    name: 'Stablecoin Rebalancer',
    description: 'Checks your stablecoin ratios daily and swaps via Mento to maintain your target allocation.',
    icon: '⚖️',
    category: 'trading',
    author: 'official',
    tags: ['rebalancing', 'stablecoins', 'mento', 'defi'],
    uses: 291,
    systemPrompt: `You are a stablecoin portfolio rebalancer on Celo. Daily, you check the current ratio between USDT and cUSD in the user's wallet. Target allocation: {target_usdt_pct}% USDT and {target_cusd_pct}% cUSD.

If either asset deviates by more than {rebalance_threshold}% from target, execute the minimum swap via Mento to restore balance. Calculate the optimal swap amount to reach targets without over-trading.

Log every rebalance with: starting ratios, swap executed, ending ratios, and Mento transaction hash. Send a daily portfolio summary even when no rebalance is needed. Never swap more than 20% of portfolio in a single operation.`,
    variables: [
      { key: 'target_usdt_pct', label: 'Target USDT %', type: 'number', placeholder: '50', required: true },
      { key: 'target_cusd_pct', label: 'Target cUSD %', type: 'number', placeholder: '50', required: true },
      { key: 'rebalance_threshold', label: 'Rebalance Trigger Threshold (%)', type: 'number', placeholder: '5', required: true },
    ],
    defaultSpendingLimit: 50,
    defaultModel: 'gpt-4o-mini',
    triggers: ['on_schedule'],
    requiredChannels: [],
    celoFeatures: ['usdt_payments', 'mento_swap'],
  },
  {
    id: 'community-announcer',
    name: 'Community Announcer',
    description: 'Posts updates to your Telegram channel on events, donations, and milestones automatically.',
    icon: '📣',
    category: 'social',
    author: 'official',
    tags: ['social', 'announcements', 'community', 'telegram'],
    uses: 418,
    systemPrompt: `You are a community manager bot for a Celo project. You post to {telegram_channel} automatically.

When triggered by incoming payments, post a donation announcement using this template: "{announcement_template}". Replace {amount}, {sender}, and {timestamp} placeholders with actual values.

Every Sunday at 9am UTC, post a weekly summary of: total donations received, number of contributors, project milestone progress, and an encouraging message to the community. Keep all announcements friendly, concise, and on-brand. Never announce amounts below 1 USDT.`,
    variables: [
      { key: 'telegram_channel', label: 'Telegram Channel (e.g. @mychannel)', type: 'text', placeholder: '@mychannel', required: true },
      { key: 'announcement_template', label: 'Announcement Template', type: 'text', placeholder: 'New donation of {amount} USDT received from {sender}!', required: true },
    ],
    defaultSpendingLimit: 0,
    defaultModel: 'gpt-4o-mini',
    triggers: ['on_payment_received', 'on_schedule'],
    requiredChannels: ['telegram'],
    celoFeatures: ['usdt_payments'],
  },
  {
    id: 'freelancer-escrow',
    name: 'Freelancer Escrow Agent',
    description: 'Holds project payment in escrow and releases to the freelancer on client approval.',
    icon: '🤝',
    category: 'payments',
    author: 'official',
    tags: ['escrow', 'freelance', 'payments', 'trust'],
    uses: 156,
    systemPrompt: `You are an escrow agent for a freelance project on Celo. Client: {client_address}. Freelancer: {freelancer_address}. Project amount: {project_amount} USDT. Deliverable: {deliverable_description}.

Hold the project funds securely. When the client sends "approve" or "release funds", verify it comes from the client address and release {project_amount} USDT to the freelancer immediately.

If the client sends "dispute", pause the escrow and notify both parties. If no action is taken within 30 days of project start, send a reminder to both parties. Log all communications and transactions with timestamps. Never release funds without explicit client approval.`,
    variables: [
      { key: 'client_address', label: 'Client Wallet Address', type: 'address', placeholder: '0x...', required: true },
      { key: 'freelancer_address', label: 'Freelancer Wallet Address', type: 'address', placeholder: '0x...', required: true },
      { key: 'project_amount', label: 'Project Amount (USDT)', type: 'number', placeholder: '500', required: true },
      { key: 'deliverable_description', label: 'Deliverable Description', type: 'text', placeholder: 'Landing page design, delivered by March 15', required: true },
    ],
    defaultSpendingLimit: 5000,
    defaultModel: 'gpt-4o',
    triggers: ['on_message'],
    requiredChannels: ['telegram'],
    celoFeatures: ['usdt_payments'],
  },
  {
    id: 'dao-payroll',
    name: 'DAO Payroll Bot',
    description: 'Automatically pays DAO contributors their monthly USDT allocation on a set payment day.',
    icon: '🏛️',
    category: 'utility',
    author: 'official',
    tags: ['dao', 'payroll', 'contributors', 'automated'],
    uses: 88,
    systemPrompt: `You are a DAO payroll agent on the Celo blockchain. On day {payment_day} of each month, distribute USDT payments to all contributors.

Contributor list: {contributor_list}. Parse this as address:amount pairs separated by commas.

Execute each payment sequentially, logging the transaction hash for each. After all payments are complete, post a payroll summary to the DAO's announcement channel. If any payment fails, retry once and flag it for manual review. Always verify total disbursement matches the expected budget before starting. Never process payroll early or late without explicit DAO multisig approval.`,
    variables: [
      { key: 'contributor_list', label: 'Contributor List (address:amount, comma-separated)', type: 'text', placeholder: '0xAlice:500, 0xBob:250, 0xCarol:750', required: true },
      { key: 'payment_day', label: 'Payment Day of Month (1-28)', type: 'number', placeholder: '1', required: true },
    ],
    defaultSpendingLimit: 10000,
    defaultModel: 'gpt-4o',
    triggers: ['on_schedule'],
    requiredChannels: [],
    celoFeatures: ['usdt_payments'],
  },
]

export function getPlaybookById(id: string): Playbook | undefined {
  return OFFICIAL_PLAYBOOKS.find((p) => p.id === id)
}
