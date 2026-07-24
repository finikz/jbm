/**
 * 九维进销存 — 种子数据
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  if (process.env.NODE_ENV === 'production' && !process.env.SEED_OWNER_PASSWORD) {
    throw new Error('生产环境运行 seed 需要设置 SEED_OWNER_PASSWORD');
  }
  const seedPhone = process.env.SEED_OWNER_PHONE || '13800000001';
  const seedPassword = process.env.SEED_OWNER_PASSWORD || 'jiuv2024';
  console.log('🌱 开始生成种子数据...');

  // ---- 用户 ----
  const passwordHash = await bcrypt.hash(seedPassword, 10);
  const owner = await prisma.user.upsert({
    where: { phone: seedPhone },
    update: {},
    create: {
      phone: seedPhone,
      password: passwordHash,
      name: '九维店主',
      role: 'OWNER',
    },
  });
  console.log(`  ✅ 用户: ${owner.name} (${owner.phone})`);

  const staff = await prisma.user.upsert({
    where: { phone: '13800000002' },
    update: {},
    create: {
      phone: '13800000002',
      password: passwordHash,
      name: '店员小张',
      role: 'STAFF',
    },
  });
  console.log(`  ✅ 用户: ${staff.name} (${staff.phone})`);

  // ---- 供应商 ----
  const suppliers = [
    { name: '广州精酿贸易', contact: '王经理', phone: '13900000001', address: '广州市海珠区' },
    { name: '拳头精酿直供', contact: '李总', phone: '13900000002', address: '广州市天河区' },
  ];
  for (const s of suppliers) {
    await prisma.supplier.upsert({
      where: { id: `seed-supplier-${s.name}` },
      update: {},
      create: { id: `seed-supplier-${s.name}`, ...s },
    });
  }
  console.log(`  ✅ 供应商: ${suppliers.length} 个`);

  // ---- 啤酒 SKU ----
  const beers = [
    {
      id: 'seed-beer-ipa',
      name: '九维 IPA',
      brewery: '九维精酿',
      style: 'American IPA',
      abv: 6.5,
      plato: 15.0,
      ibu: 55,
      priceLarge: 3800,  // ¥38
      priceMedium: 2800, // ¥28
      description: '经典美式 IPA，热带水果香气，苦度适中',
    },
    {
      id: 'seed-beer-stout',
      name: '午夜世涛',
      brewery: '九维精酿',
      style: 'Imperial Stout',
      abv: 8.2,
      plato: 20.0,
      ibu: 45,
      priceLarge: 4800,  // ¥48
      priceMedium: 3600, // ¥36
      description: '深色帝国世涛，巧克力与咖啡风味',
    },
    {
      id: 'seed-beer-witbier',
      name: '云端小麦',
      brewery: '九维精酿',
      style: 'Belgian Witbier',
      abv: 4.8,
      plato: 12.0,
      ibu: 18,
      priceLarge: 3200,  // ¥32
      priceMedium: 2400, // ¥24
      description: '比利时白啤，橙皮与芫荽香气',
    },
    {
      id: 'seed-beer-sour',
      name: '酸涩日记',
      brewery: '九维精酿',
      style: 'Berliner Weisse',
      abv: 3.5,
      plato: 9.0,
      ibu: 8,
      priceLarge: 3500,
      priceMedium: 2600,
      description: '柏林酸小麦，清爽酸味',
    },
    {
      id: 'seed-beer-lager',
      name: '纯金拉格',
      brewery: '九维精酿',
      style: 'Helles Lager',
      abv: 4.9,
      plato: 11.5,
      ibu: 22,
      priceLarge: 3000,
      priceMedium: 2200,
      description: '德式清亮拉格，麦芽香甜',
    },
  ];
  for (const b of beers) {
    await prisma.beer.upsert({
      where: { id: b.id },
      update: {},
      create: b,
    });
  }
  console.log(`  ✅ 啤酒 SKU: ${beers.length} 款`);

  // ---- 龙头 (1-11) ----
  for (let i = 1; i <= 11; i++) {
    await prisma.tap.upsert({
      where: { id: i },
      update: {},
      create: { id: i, status: 'INACTIVE' },
    });
  }
  console.log(`  ✅ 龙头: 11 个`);

  // ---- Keg 批次 ----
  const kegs = [
    {
      id: 'seed-keg-1',
      beerId: 'seed-beer-ipa',
      batchNo: 'IPA-20240101',
      volumeLiters: 18.0,
      initialVolumeLiters: 20.0,
      costCents: 120000, // ¥1200
      supplierId: 'seed-supplier-广州精酿贸易',
      tapId: 1,
    },
    {
      id: 'seed-keg-2',
      beerId: 'seed-beer-stout',
      batchNo: 'STOUT-20240101',
      volumeLiters: 15.5,
      initialVolumeLiters: 20.0,
      costCents: 150000,
      supplierId: 'seed-supplier-拳头精酿直供',
      tapId: 2,
    },
    {
      id: 'seed-keg-3',
      beerId: 'seed-beer-witbier',
      batchNo: 'WIT-20240101',
      volumeLiters: 1.5, // 低库存预警
      initialVolumeLiters: 20.0,
      costCents: 100000,
      supplierId: 'seed-supplier-广州精酿贸易',
      tapId: 3,
    },
    {
      id: 'seed-keg-4',
      beerId: 'seed-beer-lager',
      batchNo: 'LAGER-20240101',
      volumeLiters: 19.0,
      initialVolumeLiters: 20.0,
      costCents: 90000,
      supplierId: 'seed-supplier-广州精酿贸易',
      tapId: 4,
    },
    {
      id: 'seed-keg-5',
      beerId: 'seed-beer-sour',
      batchNo: 'SOUR-20240101',
      volumeLiters: 10.0,
      initialVolumeLiters: 20.0,
      costCents: 110000,
      supplierId: 'seed-supplier-拳头精酿直供',
      tapId: 5,
    },
  ];
  for (const k of kegs) {
    await prisma.keg.upsert({
      where: { id: k.id },
      update: {},
      create: k,
    });
    // 激活对应龙头
    if (k.tapId) {
      await prisma.tap.update({
        where: { id: k.tapId },
        data: { kegId: k.id, status: 'ACTIVE' },
      });
    }
  }
  console.log(`  ✅ Keg 批次: ${kegs.length} 个（龙头 1-5 已激活）`);

  // ---- 模拟销售记录（可重复执行） ----
  const today = new Date();
  for (let day = 0; day < 7; day++) {
    const date = new Date(today);
    date.setDate(date.getDate() - day);
    const orderCount = 3;
    for (let i = 0; i < orderCount; i++) {
      const beerChoice = beers[(day * orderCount + i) % beers.length];
      const isLarge = (day + i) % 2 === 0;
      const priceCents = isLarge ? beerChoice.priceLarge : beerChoice.priceMedium;
      const volumeMl = isLarge ? 500 : 350;
      const quantity = ((day + i) % 3) + 1;
      const orderNo = `SEED-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      await prisma.saleOrder.upsert({
        where: { orderNo },
        update: {},
        create: {
          orderNo, status: 'COMPLETED', totalCents: priceCents * quantity, createdAt: date,
          items: { create: { beerId: beerChoice.id, cupSize: isLarge ? 'LARGE' : 'MEDIUM',
            volumeMl, priceCents, quantity, subtotalCents: priceCents * quantity } },
        },
      });
    }
  }


  console.log('\n🎉 种子数据生成完成！');
  console.log('   登录账号已创建，请通过安全渠道获取密码');
}

main()
  .catch((e) => {
    console.error('❌ 种子数据生成失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
