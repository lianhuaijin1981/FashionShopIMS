import type {
  Product,
  Inventory,
  Supplier,
  PurchasePlan,
  PurchaseOrder,
  SalesOrder,
  Member,
  Store,
  User,
  AppSettings,
  Notification,
  Activity,
  SalesTrendPoint,
} from '@/types';

// ==========================================
// StyleStock — Mock Data
// ==========================================

export const STORES: Store[] = [
  { id: 'HQ', name: '总店', address: '北京市朝阳区建国路88号', phone: '010-8888-1001', manager: '陈明', status: 'active', createdAt: '2023-01-01' },
  { id: 'WFJ', name: '王府井分店', address: '北京市东城区王府井大街255号', phone: '010-8888-1002', manager: '李华', status: 'active', createdAt: '2023-03-15' },
  { id: 'SLT', name: '三里屯分店', address: '北京市朝阳区三里屯路19号', phone: '010-8888-1003', manager: '王强', status: 'active', createdAt: '2023-06-01' },
  { id: 'XD', name: '西单分店', address: '北京市西城区西单北大街120号', phone: '010-8888-1004', manager: '张丽', status: 'active', createdAt: '2024-01-10' },
];

export const USERS: User[] = [
  { id: 'u1', account: 'admin', name: '系统管理员', role: 'admin', storeId: 'HQ', storeName: '总店', phone: '13800138001', status: 'active', lastLogin: '2025-04-02T08:30:00' },
  { id: 'u2', account: 'shop01', name: '李华', role: 'shop_manager', storeId: 'WFJ', storeName: '王府井分店', phone: '13800138002', status: 'active', lastLogin: '2025-04-02T09:00:00' },
  { id: 'u3', account: 'staff01', name: '张丽', role: 'staff', storeId: 'XD', storeName: '西单分店', phone: '13800138003', status: 'active', lastLogin: '2025-04-01T18:00:00' },
  { id: 'u4', account: 'staff02', name: '王强', role: 'staff', storeId: 'SLT', storeName: '三里屯分店', phone: '13800138004', status: 'active', lastLogin: '2025-04-01T17:30:00' },
];

export const DEMO_CREDENTIALS = [
  { account: 'admin', password: '123456', role: 'admin' as const },
  { account: 'shop01', password: '123456', role: 'shop_manager' as const },
  { account: 'staff01', password: '123456', role: 'staff' as const },
  { account: 'staff02', password: '123456', role: 'staff' as const },
];

const CATEGORIES = ['上衣', '裤装', '裙装', '外套', '配饰'];
const SUBCATEGORIES: Record<string, string[]> = {
  '上衣': ['T恤', '衬衫', '卫衣', '针织衫', '背心'],
  '裤装': ['牛仔裤', '休闲裤', '西裤', '短裤'],
  '裙装': ['连衣裙', '半身裙', '长裙'],
  '外套': ['夹克', '风衣', '大衣', '羽绒服'],
  '配饰': ['围巾', '帽子', '腰带', '包包'],
};

const COLORS = [
  { name: '黑色', hex: '#1a1a1a' },
  { name: '白色', hex: '#f5f5f5' },
  { name: '灰色', hex: '#888888' },
  { name: '米色', hex: '#d4c4a8' },
  { name: '藏青', hex: '#2c3e6b' },
  { name: '蓝色', hex: '#3b6ea5' },
  { name: '酒红', hex: '#722f37' },
  { name: '卡其', hex: '#c3b091' },
];

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

function generateProducts(): Product[] {
  const products: Product[] = [];
  const productNames: Record<string, string[]> = {
    'T恤': ['经典款T恤', '印花T恤', '条纹T恤', '纯色基础T恤', 'V领T恤'],
    '衬衫': ['牛津纺衬衫', '格子衬衫', '亚麻衬衫', '商务衬衫', '牛仔衬衫'],
    '卫衣': ['连帽卫衣', '圆领卫衣', '拉链卫衣', '加绒卫衣', '印花卫衣'],
    '针织衫': ['圆领针织衫', 'V领针织衫', '高领毛衣', '开衫针织', '羊毛衫'],
    '背心': ['运动背心', '针织背心', '打底背心'],
    '牛仔裤': ['修身牛仔裤', '直筒牛仔裤', '阔腿牛仔裤', '破洞牛仔裤', '高腰牛仔裤'],
    '休闲裤': ['束脚休闲裤', '直筒休闲裤', '工装裤', '运动裤', '哈伦裤'],
    '西裤': ['修身西裤', '直筒西裤', '九分西裤'],
    '短裤': ['牛仔短裤', '运动短裤', '休闲短裤'],
    '连衣裙': ['碎花连衣裙', '针织连衣裙', '衬衫连衣裙', '吊带连衣裙', 'A字连衣裙'],
    '半身裙': ['A字半身裙', '百褶裙', '包臀裙', '牛仔半裙'],
    '长裙': ['及踝长裙', '波西米亚长裙', '蕾丝长裙'],
    '夹克': ['牛仔夹克', '皮夹克', '棒球夹克', '工装夹克', '飞行员夹克'],
    '风衣': ['经典风衣', '短款风衣', '双排扣风衣'],
    '大衣': ['羊毛大衣', '呢子大衣', '短款大衣', '中长款大衣'],
    '羽绒服': ['轻薄羽绒服', '中长款羽绒服', '短款羽绒服'],
    '围巾': ['羊毛围巾', '丝巾', '针织围巾', '格纹围巾'],
    '帽子': ['棒球帽', '贝雷帽', '针织帽', '渔夫帽'],
    '腰带': ['真皮腰带', '编织腰带', '链条腰带'],
    '包包': ['单肩包', '手提包', '斜挎包', '背包'],
  };

  let id = 1;
  CATEGORIES.forEach((category) => {
    const subs = SUBCATEGORIES[category];
    subs.forEach((sub) => {
      const names = productNames[sub] || [sub];
      names.forEach((name) => {
        const numSpecs = 2 + Math.floor(Math.random() * 3); // 2-4 colors
        const specs: Product['specs'] = [];
        const usedColorIndices = new Set<number>();
        for (let i = 0; i < numSpecs; i++) {
          let colorIdx: number;
          do { colorIdx = Math.floor(Math.random() * COLORS.length); } while (usedColorIndices.has(colorIdx));
          usedColorIndices.add(colorIdx);
          const color = COLORS[colorIdx];
          const sizes: Record<string, number> = {};
          const numSizes = 3 + Math.floor(Math.random() * 3);
          const usedSizeIndices = new Set<number>();
          for (let j = 0; j < numSizes; j++) {
            let sizeIdx: number;
            do { sizeIdx = Math.floor(Math.random() * SIZES.length); } while (usedSizeIndices.has(sizeIdx));
            usedSizeIndices.add(sizeIdx);
            sizes[SIZES[sizeIdx]] = Math.floor(Math.random() * 100) + 5;
          }
          specs.push({ color: color.name, colorHex: color.hex, sizes });
        }

        const costPrice = Math.floor(Math.random() * 300) + 50;
        const retailPrice = Math.floor(costPrice * (1.8 + Math.random() * 1.2));

        products.push({
          id: `p${id}`,
          sku: `${String.fromCharCode(65 + Math.floor(Math.random() * 3))}${Math.floor(1000 + Math.random() * 9000)}`,
          name,
          category,
          subcategory: sub,
          description: `精选${name}，采用优质面料，版型修身，适合多种场合穿着。`,
          costPrice,
          retailPrice,
          wholesalePrice: Math.floor(retailPrice * 0.7),
          specs,
          images: [],
          status: Math.random() > 0.1 ? 'active' : 'discontinued',
          createdAt: `2024-${String(1 + Math.floor(Math.random() * 12)).padStart(2, '0')}-${String(1 + Math.floor(Math.random() * 28)).padStart(2, '0')}`,
          updatedAt: '2025-04-01',
          supplierId: `s${1 + Math.floor(Math.random() * 20)}`,
          season: ['春/夏', '秋/冬', '四季'][Math.floor(Math.random() * 3)],
          year: 2024 + Math.floor(Math.random() * 2),
          tags: [sub, category, ...specs.map(s => s.color)],
        });
        id++;
      });
    });
  });

  return products;
}

export const PRODUCTS: Product[] = generateProducts();

export function generateInventory(products: Product[]): Inventory[] {
  const inventory: Inventory[] = [];
  let id = 1;
  products.forEach((product) => {
    product.specs.forEach((spec) => {
      Object.entries(spec.sizes).forEach(([size, qty]) => {
        const storeId = STORE_IDS[Math.floor(Math.random() * STORE_IDS.length)];
        inventory.push({
          id: `inv${id}`,
          productId: product.id,
          sku: product.sku,
          productName: product.name,
          color: spec.color,
          colorHex: spec.colorHex,
          size,
          quantity: qty,
          storeId,
          storeName: STORES.find(s => s.id === storeId)?.name || '总店',
          lastUpdated: '2025-04-01',
          minStock: 5,
          maxStock: 200,
        });
        id++;
      });
    });
  });
  return inventory;
}

const STORE_IDS = ['HQ', 'WFJ', 'SLT', 'XD'];

export const SUPPLIERS: Supplier[] = Array.from({ length: 20 }, (_, i) => ({
  id: `s${i + 1}`,
  name: ['上海盛泰纺织', '广州锦瑟服饰', '杭州丝绸世家', '深圳优品服装', '苏州锦绣纺织',
    '宁波瑞丰制衣', '温州鹿城服装', '东莞虎门服饰', '厦门雅韵纺织', '青岛红领制衣',
    '大连大杨创世', '武汉汉正服装', '成都蜀锦服饰', '重庆渝派服装', '郑州银基服饰',
    '石家庄常山纺织', '济南元首针织', '南京海澜之家', '合肥华孚色纺', '长沙梦洁服饰'][i],
  contact: ['王经理', '李经理', '张经理', '刘经理', '陈经理'][Math.floor(Math.random() * 5)],
  phone: `1${[3, 5, 7, 8, 9][Math.floor(Math.random() * 5)]}${Math.floor(100000000 + Math.random() * 900000000)}`,
  email: `supplier${i + 1}@example.com`,
  address: `中国某省某市某区某路${Math.floor(100 + Math.random() * 900)}号`,
  category: CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)],
  status: Math.random() > 0.1 ? 'active' : 'inactive',
  rating: 3 + Math.floor(Math.random() * 3),
  totalOrders: Math.floor(Math.random() * 100),
  createdAt: `2023-${String(1 + Math.floor(Math.random() * 12)).padStart(2, '0')}-01`,
}));

export const MEMBERS: Member[] = Array.from({ length: 100 }, (_, i) => {
  const gender = (['male', 'female', 'other'] as const)[Math.floor(Math.random() * 3)];
  const firstNames = ['李', '王', '张', '刘', '陈', '杨', '赵', '黄', '周', '吴', '徐', '孙', '马', '朱', '胡', '郭', '林', '何', '高', '罗'];
  const lastNames = ['芳', '娜', '秀', '敏', '静', '丽', '强', '磊', '军', '洋', '勇', '艳', '杰', '涛', '明', '超', '秀兰', '霞', '平', '刚'];
  const name = `${firstNames[Math.floor(Math.random() * firstNames.length)]}${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
  const totalSpent = Math.floor(Math.random() * 20000) + 500;
  const level = totalSpent > 15000 ? 'platinum' : totalSpent > 8000 ? 'gold' : totalSpent > 3000 ? 'silver' : 'bronze';

  return {
    id: `m${i + 1}`,
    name,
    phone: `138${String(Math.floor(10000000 + Math.random() * 90000000)).padStart(8, '0')}`,
    gender,
    birthday: `${1980 + Math.floor(Math.random() * 30)}-${String(1 + Math.floor(Math.random() * 12)).padStart(2, '0')}-${String(1 + Math.floor(Math.random() * 28)).padStart(2, '0')}`,
    level,
    points: Math.floor(totalSpent * 0.1),
    storedValue: Math.floor(Math.random() * 2000),
    totalSpent,
    totalOrders: Math.floor(Math.random() * 50) + 1,
    lastPurchaseDate: `2025-${String(1 + Math.floor(Math.random() * 4)).padStart(2, '0')}-${String(1 + Math.floor(Math.random() * 30)).padStart(2, '0')}`,
    status: 'active',
    createdAt: `2024-${String(1 + Math.floor(Math.random() * 12)).padStart(2, '0')}-${String(1 + Math.floor(Math.random() * 28)).padStart(2, '0')}`,
    notes: '',
  };
});

export function generateSalesOrders(): SalesOrder[] {
  const orders: SalesOrder[] = [];
  const paymentMethods: SalesOrder['paymentMethod'][] = ['cash', 'wechat', 'alipay', 'card', 'stored_value'];
  const operators = ['张丽', '王强', '李芳', '赵敏', '陈明'];

  for (let i = 0; i < 200; i++) {
    const numItems = 1 + Math.floor(Math.random() * 4);
    const items: { productId: string; sku: string; productName: string; color: string; size: string; quantity: number; unitPrice: number; totalPrice: number }[] = [];
    let totalAmount = 0;

    for (let j = 0; j < numItems; j++) {
      const product = PRODUCTS[Math.floor(Math.random() * PRODUCTS.length)];
      const spec = product.specs[Math.floor(Math.random() * product.specs.length)];
      const sizeKeys = Object.keys(spec.sizes);
      const size = sizeKeys[Math.floor(Math.random() * sizeKeys.length)];
      const qty = 1 + Math.floor(Math.random() * 3);
      const price = product.retailPrice;
      const total = qty * price;
      totalAmount += total;

      items.push({
        productId: product.id,
        sku: product.sku,
        productName: product.name,
        color: spec.color,
        size,
        quantity: qty,
        unitPrice: price,
        totalPrice: total,
      });
    }

    const hasMember = Math.random() > 0.3;
    const member = hasMember ? MEMBERS[Math.floor(Math.random() * MEMBERS.length)] : undefined;
    const discount = Math.random() > 0.8 ? Math.floor(totalAmount * 0.1) : 0;
    const day = 1 + Math.floor(Math.random() * 30);
    const month = 1 + Math.floor(Math.random() * 4);

    orders.push({
      id: `so${i + 1}`,
      orderNo: `SO2025${String(month).padStart(2, '0')}${String(day).padStart(2, '0')}${String(1000 + i).slice(-4)}`,
      items,
      totalAmount,
      totalQuantity: items.reduce((s, it) => s + it.quantity, 0),
      discount,
      finalAmount: totalAmount - discount,
      paymentMethod: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
      memberId: member?.id,
      memberName: member?.name,
      memberPhone: member?.phone,
      pointsEarned: Math.floor((totalAmount - discount) * 0.1),
      pointsUsed: 0,
      status: 'completed',
      storeId: STORE_IDS[Math.floor(Math.random() * STORE_IDS.length)],
      storeName: '',
      operator: operators[Math.floor(Math.random() * operators.length)],
      createdAt: `2025-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(Math.floor(9 + Math.random() * 12)).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`,
      notes: '',
    });
  }

  // Sort by date descending
  orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Fix store names after sort
  orders.forEach(o => {
    o.storeName = STORES.find(s => s.id === o.storeId)?.name || '总店';
  });

  return orders;
}

export function generatePurchaseOrders(): PurchaseOrder[] {
  const orders: PurchaseOrder[] = [];
  const statuses: PurchaseOrder['status'][] = ['pending', 'partial', 'received', 'cancelled'];
  const operators = ['张丽', '王强', '李芳', '陈明'];

  for (let i = 0; i < 30; i++) {
    const supplier = SUPPLIERS[Math.floor(Math.random() * SUPPLIERS.length)];
    const numItems = 2 + Math.floor(Math.random() * 5);
    const items: PurchaseOrder['items'] = [];
    let totalAmount = 0;
    let totalQty = 0;

    for (let j = 0; j < numItems; j++) {
      const product = PRODUCTS[Math.floor(Math.random() * PRODUCTS.length)];
      const spec = product.specs[Math.floor(Math.random() * product.specs.length)];
      const sizeKeys = Object.keys(spec.sizes);
      const size = sizeKeys[Math.floor(Math.random() * sizeKeys.length)];
      const qty = 20 + Math.floor(Math.random() * 100);
      const price = product.costPrice;
      const total = qty * price;
      totalAmount += total;
      totalQty += qty;

      items.push({
        productId: product.id,
        sku: product.sku,
        productName: product.name,
        color: spec.color,
        size,
        quantity: qty,
        receivedQuantity: Math.random() > 0.5 ? qty : Math.floor(qty * Math.random()),
        unitPrice: price,
        totalPrice: total,
      });
    }

    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const month = 1 + Math.floor(Math.random() * 4);
    const day = 1 + Math.floor(Math.random() * 28);

    orders.push({
      id: `po${i + 1}`,
      orderNo: `CG2025${String(month).padStart(2, '0')}${String(day).padStart(2, '0')}${String(100 + i).slice(-3)}`,
      supplierId: supplier.id,
      supplierName: supplier.name,
      items,
      totalAmount,
      totalQuantity: totalQty,
      status,
      inboundStatus: status === 'received' ? 'completed' : status === 'partial' ? 'in_progress' : 'not_started',
      createdAt: `2025-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
      expectedDate: `2025-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
      createdBy: operators[Math.floor(Math.random() * operators.length)],
      notes: '',
    });
  }

  orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return orders;
}

export function generatePurchasePlans(): PurchasePlan[] {
  const plans: PurchasePlan[] = [];
  const statuses: PurchasePlan['status'][] = ['draft', 'pending', 'approved', 'ordered', 'completed', 'cancelled'];
  const operators = ['张丽', '王强', '李芳', '陈明'];

  for (let i = 0; i < 15; i++) {
    const supplier = SUPPLIERS[Math.floor(Math.random() * SUPPLIERS.length)];
    const numItems = 2 + Math.floor(Math.random() * 4);
    const items: PurchasePlan['items'] = [];
    let totalAmount = 0;
    let totalQty = 0;

    for (let j = 0; j < numItems; j++) {
      const product = PRODUCTS[Math.floor(Math.random() * PRODUCTS.length)];
      const spec = product.specs[Math.floor(Math.random() * product.specs.length)];
      const sizeKeys = Object.keys(spec.sizes);
      const size = sizeKeys[Math.floor(Math.random() * sizeKeys.length)];
      const qty = 30 + Math.floor(Math.random() * 80);
      const price = product.costPrice;
      const total = qty * price;
      totalAmount += total;
      totalQty += qty;

      items.push({
        productId: product.id,
        sku: product.sku,
        productName: product.name,
        color: spec.color,
        size,
        quantity: qty,
        unitPrice: price,
        totalPrice: total,
      });
    }

    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const month = 1 + Math.floor(Math.random() * 4);
    const day = 1 + Math.floor(Math.random() * 28);

    plans.push({
      id: `pp${i + 1}`,
      planNo: `JH2025${String(month).padStart(2, '0')}${String(day).padStart(2, '0')}${String(100 + i).slice(-3)}`,
      title: `采购计划-${supplier.category}-${i + 1}`,
      supplierId: supplier.id,
      supplierName: supplier.name,
      items,
      totalAmount,
      totalQuantity: totalQty,
      status,
      createdAt: `2025-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
      expectedDate: `2025-${String(Math.min(month + 1, 12)).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
      createdBy: operators[Math.floor(Math.random() * operators.length)],
    });
  }

  plans.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return plans;
}

export const DEFAULT_SETTINGS: AppSettings = {
  storeName: 'StyleStock总店',
  storeAddress: '北京市朝阳区建国路88号',
  storePhone: '010-8888-1001',
  receiptFooter: '感谢惠顾，欢迎再次光临！\nStyleStock服装连锁',
  lowStockThreshold: 5,
  autoBackup: true,
  theme: 'light',
  language: 'zh-CN',
};

export const INITIAL_NOTIFICATIONS: Notification[] = [
  {
    id: 'n1',
    title: '库存不足预警',
    message: 'A1001-黑色-M 库存仅剩1件，请及时补货',
    type: 'warning',
    read: false,
    createdAt: '2025-04-02T09:30:00',
    route: '/inventory',
  },
  {
    id: 'n2',
    title: '采购订单到货',
    message: '采购单#CG20250328 已到货50件商品',
    type: 'success',
    read: false,
    createdAt: '2025-04-02T10:15:00',
    route: '/purchase',
  },
  {
    id: 'n3',
    title: '新会员注册',
    message: '会员李芳注册成功，消费¥520',
    type: 'info',
    read: false,
    createdAt: '2025-04-02T09:58:00',
    route: '/members',
  },
];

export const SALES_TREND_DATA: SalesTrendPoint[] = [
  { date: '4/1', amount: 8200, orders: 52 },
  { date: '4/2', amount: 9500, orders: 61 },
  { date: '4/3', amount: 7800, orders: 48 },
  { date: '4/4', amount: 11200, orders: 72 },
  { date: '4/5', amount: 12847, orders: 86 },
  { date: '4/6', amount: 10500, orders: 68 },
  { date: '4/7', amount: 8900, orders: 55 },
  { date: '4/8', amount: 7200, orders: 42 },
  { date: '4/9', amount: 9800, orders: 63 },
  { date: '4/10', amount: 11500, orders: 74 },
  { date: '4/11', amount: 10200, orders: 66 },
  { date: '4/12', amount: 8600, orders: 53 },
  { date: '4/13', amount: 9100, orders: 58 },
  { date: '4/14', amount: 10800, orders: 71 },
];

export const LOW_STOCK_ITEMS = [
  { sku: 'A1001', name: '经典款T恤', color: '黑色', colorHex: '#1a1a1a', size: 'M', stock: 1 },
  { sku: 'A1002', name: '修身牛仔裤', color: '白色', colorHex: '#f5f5f5', size: 'L', stock: 0 },
  { sku: 'B2001', name: '休闲衬衫', color: '灰色', colorHex: '#888888', size: 'S', stock: 2 },
  { sku: 'A1003', name: '运动卫衣', color: '蓝色', colorHex: '#3b6ea5', size: 'XL', stock: 1 },
  { sku: 'C3001', name: '针织开衫', color: '米色', colorHex: '#d4c4a8', size: 'M', stock: 3 },
  { sku: 'C3001', name: '针织开衫', color: '黑色', colorHex: '#1a1a1a', size: 'L', stock: 2 },
];

export const RECENT_ACTIVITIES: Activity[] = [
  { id: 'a1', type: 'sale', title: '完成销售单 #20250402042', time: '10:23', amount: 386, operator: '张丽' },
  { id: 'a2', type: 'inbound', title: '商品 A1001-黑色-M 入库50件', time: '10:15', reference: '采购单#CG20250328' },
  { id: 'a3', type: 'member', title: '会员李芳(138****6688) 消费', time: '09:58', amount: 520, points: 520 },
  { id: 'a4', type: 'sale', title: '完成销售单 #20250402041', time: '09:42', amount: 1280, operator: '王强' },
  { id: 'a5', type: 'alert', title: '系统预警: A1002-白色-L 库存不足', time: '09:30', detail: '仅剩1件' },
  { id: 'a6', type: 'sale', title: '完成销售单 #20250402040', time: '09:15', amount: 650, operator: '张丽' },
  { id: 'a7', type: 'inbound', title: '商品 B2001-灰色-S 入库30件', time: '09:00', reference: '采购单#CG20250325' },
  { id: 'a8', type: 'member', title: '会员王磊(139****1234) 充值', time: '08:45', amount: 1000, points: 0 },
  { id: 'a9', type: 'sale', title: '完成销售单 #20250402039', time: '08:30', amount: 920, operator: '李芳' },
  { id: 'a10', type: 'count', title: '库存盘点完成', time: '08:00', detail: '盘点差异: +3件' },
];

export const SPARKLINE_DATA_14D = [
  [4200, 5100, 4800, 6200, 5800, 7200, 6800, 5500, 4900, 7100, 6500, 5800, 6200, 7000],
  [32, 38, 35, 45, 42, 52, 48, 39, 36, 50, 46, 41, 44, 49],
  [3200, 3205, 3203, 3256, 3256, 3256, 3256, 3256, 3256, 3256, 3256, 3256, 3256, 3256],
];

// Seeding function
export function seedAllData() {
  const inventory = generateInventory(PRODUCTS);
  const sales = generateSalesOrders();
  const purchaseOrders = generatePurchaseOrders();
  const purchasePlans = generatePurchasePlans();

  return {
    products: PRODUCTS,
    inventory,
    sales,
    members: MEMBERS,
    suppliers: SUPPLIERS,
    purchaseOrders,
    purchasePlans,
    stores: STORES,
    settings: DEFAULT_SETTINGS,
    notifications: INITIAL_NOTIFICATIONS,
  };
}
