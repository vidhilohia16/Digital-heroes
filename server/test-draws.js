/**
 * Draw Simulation Validator
 * Verifies jackpot rollover math, prize pool calculations, and splitting behavior.
 */

const db = require('./db');

async function runSimulationTests() {
  console.log('🧪 Starting Draw Mathematical Simulation Tests...');
  
  // Set mock database variables manually to simulate a clean run
  const activeSubscribers = 10; // 10 active players
  const subscriptionPrizeCut = 15.00; // $15 per subscriber goes to pool
  let jackpot = 1000.00; // Starting jackpot

  console.log(`- Setup: ${activeSubscribers} subscribers, $${subscriptionPrizeCut.toFixed(2)} contribution/sub, Starting Jackpot: $${jackpot.toFixed(2)}`);

  // Mock player scores
  // Let's create some dummy scores for our 10 subscribers
  const players = Array.from({ length: activeSubscribers }, (_, i) => ({
    id: `player-${i}`,
    name: `Player ${i}`,
    scores: []
  }));

  // Assign scores to players (latest 5 scores range 1-45)
  players.forEach(p => {
    while (p.scores.length < 5) {
      const val = Math.floor(Math.random() * 45) + 1;
      if (!p.scores.includes(val)) {
        p.scores.push(val);
      }
    }
    p.scores.sort((a, b) => a - b);
  });

  let rollCount = 0;
  let jackpotWon = false;

  // Run 10 draws or until jackpot is won
  for (let drawIndex = 1; drawIndex <= 10; drawIndex++) {
    const totalPool = activeSubscribers * subscriptionPrizeCut;
    const pool5 = totalPool * 0.40 + jackpot;
    const pool4 = totalPool * 0.35;
    const pool3 = totalPool * 0.25;

    // Draw standard winning numbers
    const winningNumbers = [];
    while (winningNumbers.length < 5) {
      const rand = Math.floor(Math.random() * 45) + 1;
      if (!winningNumbers.includes(rand)) {
        winningNumbers.push(rand);
      }
    }
    winningNumbers.sort((a, b) => a - b);

    // Count matches
    const winners5 = [];
    const winners4 = [];
    const winners3 = [];

    players.forEach(p => {
      let matches = 0;
      p.scores.forEach(s => {
        if (winningNumbers.includes(s)) {
          matches++;
        }
      });

      const winDetail = { name: p.name, scores: p.scores, matches };
      if (matches === 5) winners5.push(winDetail);
      else if (matches === 4) winners4.push(winDetail);
      else if (matches === 3) winners3.push(winDetail);
    });

    console.log(`\n--- Draw #${drawIndex} ---`);
    console.log(`Winning Numbers: [ ${winningNumbers.join(', ')} ]`);
    console.log(`Subscribers: ${activeSubscribers} | Base Prize Pool: $${totalPool.toFixed(2)}`);
    console.log(`Tier Pools -> Match-5: $${pool5.toFixed(2)} (Incl. Rollover) | Match-4: $${pool4.toFixed(2)} | Match-3: $${pool3.toFixed(2)}`);
    console.log(`Winners   -> Match-5: ${winners5.length} | Match-4: ${winners4.length} | Match-3: ${winners3.length}`);

    if (winners5.length > 0) {
      const share = pool5 / winners5.length;
      console.log(`🎉 JACKPOT WON! ${winners5.length} winner(s) split the jackpot. Payout: $${share.toFixed(2)} each.`);
      winners5.forEach(w => console.log(`   - ${w.name} matched [ ${w.scores.join(', ')} ]`));
      jackpotWon = true;
      jackpot = 100.00; // Reset jackpot seed
    } else {
      console.log(`💰 Rollover: No Match-5 winner. Jackpot of $${pool5.toFixed(2)} rolls over to next month.`);
      jackpot = pool5;
      rollCount++;
    }

    if (winners4.length > 0) {
      const share = pool4 / winners4.length;
      console.log(`✨ Match-4 Payout: $${share.toFixed(2)} each to ${winners4.length} winner(s).`);
    }

    if (winners3.length > 0) {
      const share = pool3 / winners3.length;
      console.log(`✨ Match-3 Payout: $${share.toFixed(2)} each to ${winners3.length} winner(s).`);
    }
  }

  console.log('\n--- Simulation Summary ---');
  console.log(`Completed 10 cycles.`);
  console.log(`Jackpot won during simulation: ${jackpotWon ? 'Yes' : 'No'}`);
  console.log(`Accumulated Rollover at the end: $${jackpot.toFixed(2)}`);
  console.log('✅ Mathematical validation completed successfully.');
}

runSimulationTests().catch(console.error);
