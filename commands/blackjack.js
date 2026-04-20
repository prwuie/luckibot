async function resolve(interaction) {

  try {

    const g = games.get(interaction.user.id);

    if (!g) {
      return interaction.reply({
        content: '❌ Game expired.',
        flags: 64
      });
    }

    let user = await getUser(interaction.user.id);
    if (!user) user = { balance: 1000 };

    while (score(g.dealer) < 17) {
      g.dealer.push(draw());
    }

    const dealerScore = score(g.dealer);

    let win = 0;

    for (const hand of g.hands) {
      const s = score(hand);

      if (s > 21) continue;

      if (s > dealerScore || dealerScore > 21) {
        win += g.amount * 2;
      } else if (s === dealerScore) {
        win += g.amount;
      }
    }

    user.balance += win;
    await updateUser(interaction.user.id, user);

    const final = render(interaction.user.id, true);

    let resultText;

    if (win > g.amount) {
      resultText = `🎉 WIN +$${win}`;
    } else if (win === g.amount) {
      resultText = `🤝 PUSH +$${win}`;
    } else {
      resultText = `💀 LOSS -$${g.amount}`;
    }

    games.delete(interaction.user.id);

    return interaction.update({
      content: final + `\n\n${resultText}`,
      components: []
    });

  } catch (err) {
    console.error('RESOLVE ERROR:', err);

    if (!interaction.replied && !interaction.deferred) {
      return interaction.reply({
        content: '❌ Game crashed.',
        flags: 64
      });
    }
  }
}