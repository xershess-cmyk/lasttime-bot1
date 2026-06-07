const {
  Client, GatewayIntentBits, ButtonBuilder, ButtonStyle,
  ActionRowBuilder, EmbedBuilder, PermissionFlagsBits,
  ChannelType, StringSelectMenuBuilder, StringSelectMenuOptionBuilder,
  ModalBuilder, TextInputBuilder, TextInputStyle, AttachmentBuilder
} = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ]
});

// ==========================================
// ประเภท Ticket (แก้ได้ตรงนี้เลย)
// ==========================================
const TICKET_TYPES = [
  {
    value: 'question',
    label: '❓ สอบถามทั่วไป',
    description: 'มีคำถามหรืออยากรู้ข้อมูลเพิ่มเติม',
    emoji: '❓',
    color: 0x7c3aed,
    channelPrefix: '❓│question',
  },
  {
    value: 'problem',
    label: '🔧 แจ้งปัญหา',
    description: 'พบบั๊ก ข้อผิดพลาด หรือปัญหาในเซิร์ฟเวอร์',
    emoji: '🔧',
    color: 0xe3001b,
    channelPrefix: '🔧│problem',
  },
  {
    value: 'file',
    label: '📁 ส่งไฟล์งาน',
    description: 'ส่งไฟล์งานให้แอดมินหรือทีมงาน',
    emoji: '📁',
    color: 0x059669,
    channelPrefix: '📁│file',
  },
  {
    value: 'appeal',
    label: '⚖️ อุทธรณ์/ร้องเรียน',
    description: 'อุทธรณ์แบน หรือร้องเรียนเรื่องต่างๆ',
    emoji: '⚖️',
    color: 0xf59e0b,
    channelPrefix: '⚖️│appeal',
  },
  {
    value: 'other',
    label: '💬 อื่นๆ',
    description: 'เรื่องที่ไม่อยู่ในหมวดหมู่ข้างต้น',
    emoji: '💬',
    color: 0x6b7280,
    channelPrefix: '💬│other',
  },
];

// ==========================================
// ตั้งค่า Environment Variables
// ==========================================
const CONFIG = {
  SUPPORT_ROLE_ID: process.env.SUPPORT_ROLE_ID || '',
  LOG_CHANNEL_ID:  process.env.LOG_CHANNEL_ID  || '',
  TICKET_CATEGORY: process.env.TICKET_CATEGORY || '',
};

client.once('ready', () => {
  console.log(`✅ Ticket Bot ${client.user.tag} พร้อมใช้งาน`);
});

// ==========================================
// คำสั่ง !ticket-panel
// ==========================================
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  if (message.content === '!ticket-panel') {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
      return message.reply('❌ คุณไม่มีสิทธิ์ใช้คำสั่งนี้');
    }
    await message.delete().catch(() => {});

    const embed = new EmbedBuilder()
      .setColor(0x7c3aed)
      .setTitle('🎫 ระบบ Ticket — Last-Time Studio')
      .setDescription(
        '**ต้องการความช่วยเหลือ?**\n\n' +
        'กดปุ่มด้านล่างเพื่อเปิด Ticket\n' +
        'แล้วเลือกประเภทที่ตรงกับปัญหาของคุณ\n\n' +
        '❓ **สอบถามทั่วไป** — มีคำถามหรืออยากรู้ข้อมูล\n' +
        '🔧 **แจ้งปัญหา** — พบบั๊กหรือข้อผิดพลาด\n' +
        '📁 **ส่งไฟล์งาน** — ส่งไฟล์งานให้ทีมงาน\n' +
        '⚖️ **อุทธรณ์/ร้องเรียน** — อุทธรณ์แบนหรือร้องเรียน\n' +
        '💬 **อื่นๆ** — เรื่องนอกเหนือจากข้างต้น'
      )
      .setFooter({ text: 'Last-Time Studio • Ticket System' })
      .setTimestamp();

    const openBtn = new ButtonBuilder()
      .setCustomId('open_ticket')
      .setLabel('🎫  เปิด Ticket')
      .setStyle(ButtonStyle.Primary);

    const row = new ActionRowBuilder().addComponents(openBtn);
    await message.channel.send({ embeds: [embed], components: [row] });
  }
});

// ==========================================
// Interactions
// ==========================================
client.on('interactionCreate', async (interaction) => {

  // ========== กดปุ่มเปิด Ticket → แสดง Dropdown ==========
  if (interaction.isButton() && interaction.customId === 'open_ticket') {
    const existing = interaction.guild.channels.cache.find(
      c => c.topic === `ticket:${interaction.user.id}`
    );
    if (existing) {
      return interaction.reply({
        content: `❌ คุณมี Ticket เปิดอยู่แล้วที่ ${existing} กรุณาปิด Ticket เดิมก่อน`,
        ephemeral: true
      });
    }

    const select = new StringSelectMenuBuilder()
      .setCustomId('select_ticket_type')
      .setPlaceholder('เลือกประเภท Ticket ของคุณ...')
      .addOptions(
        TICKET_TYPES.map(t =>
          new StringSelectMenuOptionBuilder()
            .setLabel(t.label)
            .setDescription(t.description)
            .setValue(t.value)
        )
      );

    const row = new ActionRowBuilder().addComponents(select);

    await interaction.reply({
      content: '📋 **กรุณาเลือกประเภท Ticket:**',
      components: [row],
      ephemeral: true
    });
  }

  // ========== เลือกประเภท → แสดง Modal กรอกรายละเอียด ==========
  if (interaction.isStringSelectMenu() && interaction.customId === 'select_ticket_type') {
    const selectedType = interaction.values[0];

    const modal = new ModalBuilder()
      .setCustomId(`ticket_modal:${selectedType}`)
      .setTitle('📝 รายละเอียด Ticket');

    const titleInput = new TextInputBuilder()
      .setCustomId('ticket_title')
      .setLabel('หัวข้อ Ticket')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('ระบุหัวข้อสั้นๆ เช่น "บั๊กระบบสุ่มไอเทม"')
      .setRequired(true)
      .setMaxLength(100);

    const descInput = new TextInputBuilder()
      .setCustomId('ticket_desc')
      .setLabel('อธิบายปัญหาหรือสิ่งที่ต้องการ')
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder('อธิบายรายละเอียดให้ครบถ้วน เพื่อให้ทีมงานช่วยได้รวดเร็วขึ้น...')
      .setRequired(true)
      .setMaxLength(1000);

    const row1 = new ActionRowBuilder().addComponents(titleInput);
    const row2 = new ActionRowBuilder().addComponents(descInput);

    modal.addComponents(row1, row2);
    await interaction.showModal(modal);
  }

  // ========== กรอก Modal เสร็จ → สร้าง Channel ==========
  if (interaction.isModalSubmit() && interaction.customId.startsWith('ticket_modal:')) {
    await interaction.deferReply({ ephemeral: true });

    const selectedType = interaction.customId.split(':')[1];
    const ticketType   = TICKET_TYPES.find(t => t.value === selectedType);
    const user         = interaction.user;
    const guild        = interaction.guild;

    const ticketTitle = interaction.fields.getTextInputValue('ticket_title');
    const ticketDesc  = interaction.fields.getTextInputValue('ticket_desc');

    // สร้าง channel
    const safeName = user.username.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const ticketChannel = await guild.channels.create({
      name: `${ticketType.channelPrefix}-${safeName}`,
      type: ChannelType.GuildText,
      topic: `ticket:${user.id}`,
      parent: CONFIG.TICKET_CATEGORY || null,
      permissionOverwrites: [
        {
          id: guild.id,
          deny: [PermissionFlagsBits.ViewChannel],
        },
        {
          id: user.id,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ReadMessageHistory,
            PermissionFlagsBits.AttachFiles,
          ],
        },
        ...(CONFIG.SUPPORT_ROLE_ID ? [{
          id: CONFIG.SUPPORT_ROLE_ID,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ReadMessageHistory,
            PermissionFlagsBits.ManageMessages,
            PermissionFlagsBits.AttachFiles,
          ],
        }] : []),
      ],
    });

    // Embed ใน ticket channel
    const ticketEmbed = new EmbedBuilder()
      .setColor(ticketType.color)
      .setTitle(`${ticketType.emoji} ${ticketTitle}`)
      .setDescription(
        `**ผู้เปิด Ticket:** ${user}\n` +
        `**ประเภท:** ${ticketType.label}\n` +
        `**เวลาเปิด:** ${new Date().toLocaleString('th-TH')}\n\n` +
        `**รายละเอียด:**\n${ticketDesc}`
      )
      .setFooter({ text: 'Last-Time Studio • กดปุ่มปิด Ticket เมื่อปัญหาได้รับการแก้ไข' })
      .setTimestamp();

    const closeBtn = new ButtonBuilder()
      .setCustomId('close_ticket')
      .setLabel('🔒  ปิด Ticket')
      .setStyle(ButtonStyle.Danger);

    const closeRow = new ActionRowBuilder().addComponents(closeBtn);

    const mention = CONFIG.SUPPORT_ROLE_ID ? `<@&${CONFIG.SUPPORT_ROLE_ID}>` : '';

    await ticketChannel.send({
      content: `${user} ${mention}`,
      embeds: [ticketEmbed],
      components: [closeRow]
    });

    await interaction.editReply({
      content: `✅ เปิด Ticket สำเร็จ! → ${ticketChannel}`
    });
  }

  // ========== ปิด Ticket → Log + ลบ ==========
  if (interaction.isButton() && interaction.customId === 'close_ticket') {
    await interaction.deferReply();

    const channel  = interaction.channel;
    const topic    = channel.topic || '';
    const userId   = topic.replace('ticket:', '');
    const ticketUser = await client.users.fetch(userId).catch(() => null);

    if (CONFIG.LOG_CHANNEL_ID) {
      const logChannel = interaction.guild.channels.cache.get(CONFIG.LOG_CHANNEL_ID);
      if (logChannel) {
        const messages = await channel.messages.fetch({ limit: 100 });
        const transcript = messages
          .reverse()
          .filter(m => !m.author.bot || m.embeds.length > 0)
          .map(m => {
            const time = new Date(m.createdTimestamp).toLocaleString('th-TH');
            const content = m.content || (m.embeds[0]?.description ?? '');
            return `[${time}] ${m.author.tag}: ${content}`;
          })
          .join('\n');

        const logEmbed = new EmbedBuilder()
          .setColor(0x7c3aed)
          .setTitle(`📋 Ticket ปิดแล้ว — ${ticketUser?.username || 'Unknown'}`)
          .addFields(
            { name: '👤 ผู้เปิด Ticket', value: ticketUser ? `<@${ticketUser.id}>` : 'Unknown', inline: true },
            { name: '🔒 ปิดโดย', value: `${interaction.user}`, inline: true },
            { name: '📅 เวลาปิด', value: new Date().toLocaleString('th-TH'), inline: false },
            { name: '📌 ชื่อ Channel', value: channel.name, inline: false },
          )
          .setTimestamp();

        await logChannel.send({ embeds: [logEmbed] });

        if (transcript.length > 0) {
          const buffer = Buffer.from(transcript, 'utf-8');
          const attachment = new AttachmentBuilder(buffer, {
            name: `ticket-${ticketUser?.username || 'unknown'}-${Date.now()}.txt`
          });
          await logChannel.send({
            content: `📄 ประวัติการสนทนาของ ${ticketUser?.tag || 'Unknown'}`,
            files: [attachment]
          });
        }
      }
    }

    await interaction.editReply('🔒 กำลังปิด Ticket และบันทึก log... Channel จะถูกลบใน 5 วินาที');

    setTimeout(async () => {
      await channel.delete().catch(console.error);
    }, 5000);
  }
});

client.login(process.env.DISCORD_TOKEN);
