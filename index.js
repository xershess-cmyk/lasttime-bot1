const { Client, GatewayIntentBits, ButtonBuilder, ButtonStyle, ActionRowBuilder, EmbedBuilder } = require('discord.js');

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

const APPLY_URL = 'https://xershess-cmyk.github.io/mc-rp-apply/';

// ==========================================
// บอทพร้อมใช้งาน
// ==========================================
client.once('ready', () => {
  console.log(`✅ บอท ${client.user.tag} พร้อมใช้งานแล้ว`);
});

// ==========================================
// คำสั่ง !recruit — ส่ง Embed + ปุ่มสมัครงาน
// ==========================================
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  // คำสั่งสำหรับแอดมินส่ง embed สมัครงาน
  if (message.content === '!recruit') {
    // ตรวจสอบสิทธิ์ (ต้องมี role ManageGuild หรือเป็น Admin)
    if (!message.member.permissions.has('ManageGuild')) {
      return message.reply('❌ คุณไม่มีสิทธิ์ใช้คำสั่งนี้');
    }

    // ลบข้อความคำสั่งออก
    await message.delete().catch(() => {});

    const embed = new EmbedBuilder()
      .setColor(0x7c3aed) // ม่วง
      .setTitle('📋 เปิดรับสมัครทีมงาน — Last-Time Studio')
      .setDescription(
        '**ร่วมสร้างโลก Role Play ที่ดีที่สุดไปด้วยกัน**\n\nเราต้องการคนที่มีใจรัก และพร้อมพัฒนาไปด้วยกัน\n\n' +
        '**ตำแหน่งที่เปิดรับ:**\n' +
        '🗺️ **Model Builder** — สร้างแมพ\n' +
        '✍️ **Story Writer** — เขียนเนื้อเรื่องและกฏโรลเพล\n' +
        '⚙️ **Mod Maker** — พัฒนาและจัดการมอด\n' +
        '🛡️ **Discord Admin** — ดูแลชุมชน\n' +
        '🎙️ **Interviewer** — สัมภาษณ์ผู้สมัคร'
      )
      .setFooter({ text: 'Last-Time Studio • กดปุ่มด้านล่างเพื่อกรอกใบสมัคร' })
      .setTimestamp();

    const button = new ButtonBuilder()
      .setLabel('✍️  สมัครทีมงาน')
      .setURL(APPLY_URL)
      .setStyle(ButtonStyle.Link);

    const row = new ActionRowBuilder().addComponents(button);

    await message.channel.send({ embeds: [embed], components: [row] });
  }
});

client.login(process.env.DISCORD_TOKEN);
