import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import "dotenv/config";
import stickerModel from "./models/stickerModel.js";
import foodModel from "./models/foodModel.js";

const stickersData = [
  {
    name: "Golden Sparkle",
    category: "Luxury",
    filename: "sticker_sparkle.svg",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
      <defs>
        <radialGradient id="sparkleGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#FFF7AD" />
          <stop offset="50%" stop-color="#FFAE34" />
          <stop offset="100%" stop-color="#ED6B00" />
        </radialGradient>
      </defs>
      <polygon points="50,5 62,38 95,50 62,62 50,95 38,62 5,50 38,38" fill="url(#sparkleGrad)" stroke="#FFE898" stroke-width="2"/>
      <circle cx="50" cy="50" r="8" fill="#FFFFFF"/>
    </svg>`
  },
  {
    name: "Aura Crown",
    category: "Icons",
    filename: "sticker_crown.svg",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
      <defs>
        <linearGradient id="crownGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#FCD34D" />
          <stop offset="100%" stop-color="#D97706" />
        </linearGradient>
      </defs>
      <path d="M15,75 L85,75 L80,35 L62,55 L50,20 L38,55 L20,35 Z" fill="url(#crownGrad)" stroke="#B45309" stroke-width="3" stroke-linejoin="round"/>
      <circle cx="50" cy="18" r="5" fill="#EF4444"/>
      <circle cx="20" cy="33" r="5" fill="#3B82F6"/>
      <circle cx="80" cy="33" r="5" fill="#10B981"/>
      <rect x="20" y="75" width="60" height="8" rx="4" fill="#B45309"/>
    </svg>`
  },
  {
    name: "Neon Heart",
    category: "Aesthetic",
    filename: "sticker_heart.svg",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
      <defs>
        <linearGradient id="heartGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#EC4899" />
          <stop offset="100%" stop-color="#8B5CF6" />
        </linearGradient>
      </defs>
      <path d="M50,85 C20,60 10,40 10,28 C10,15 22,8 34,8 C42,8 47,13 50,18 C53,13 58,8 66,8 C78,8 90,15 90,28 C90,40 80,60 50,85 Z" fill="url(#heartGrad)" stroke="#FDF2F8" stroke-width="3"/>
      <ellipse cx="32" cy="22" rx="6" ry="3" fill="#FFFFFF" opacity="0.6" transform="rotate(-30 32 22)"/>
    </svg>`
  },
  {
    name: "Cosmic Butterfly",
    category: "Nature",
    filename: "sticker_butterfly.svg",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
      <defs>
        <linearGradient id="butterflyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#06B6D4" />
          <stop offset="100%" stop-color="#6366F1" />
        </linearGradient>
      </defs>
      <path d="M50,50 Q25,15 10,35 Q5,55 35,65 Q50,70 50,50" fill="url(#butterflyGrad)" opacity="0.9"/>
      <path d="M50,50 Q75,15 90,35 Q95,55 65,65 Q50,70 50,50" fill="url(#butterflyGrad)" opacity="0.9"/>
      <path d="M50,50 Q30,70 20,85 Q40,95 50,65" fill="#3B82F6" opacity="0.8"/>
      <path d="M50,50 Q70,70 80,85 Q60,95 50,65" fill="#3B82F6" opacity="0.8"/>
      <line x1="50" y1="30" x2="50" y2="75" stroke="#1E293B" stroke-width="4" stroke-linecap="round"/>
      <line x1="50" y1="30" x2="42" y2="18" stroke="#1E293B" stroke-width="2" stroke-linecap="round"/>
      <line x1="50" y1="30" x2="58" y2="18" stroke="#1E293B" stroke-width="2" stroke-linecap="round"/>
    </svg>`
  },
  {
    name: "Aura Flame",
    category: "Street",
    filename: "sticker_flame.svg",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
      <defs>
        <linearGradient id="flameGrad" x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stop-color="#DC2626" />
          <stop offset="50%" stop-color="#EA580C" />
          <stop offset="100%" stop-color="#FACC15" />
        </linearGradient>
      </defs>
      <path d="M50,10 Q65,35 60,50 Q70,40 75,55 Q85,75 50,95 Q15,75 25,55 Q30,40 40,50 Q35,35 50,10 Z" fill="url(#flameGrad)"/>
      <path d="M50,45 Q58,60 55,70 Q60,65 62,75 Q68,85 50,92 Q32,85 38,75 Q40,65 45,70 Q42,60 50,45 Z" fill="#FEF08A"/>
    </svg>`
  }
];

async function seed() {
  const mongoUrl = process.env.MONGO_URL || process.env.MONGODB_URI;
  await mongoose.connect(mongoUrl);
  console.log("Connected to MongoDB for seeding...");

  // Write SVG files
  if (!fs.existsSync("uploads")) {
    fs.mkdirSync("uploads", { recursive: true });
  }

  for (const item of stickersData) {
    fs.writeFileSync(path.join("uploads", item.filename), item.svg);
    const exists = await stickerModel.findOne({ name: item.name });
    if (!exists) {
      await stickerModel.create({
        name: item.name,
        category: item.category,
        image: item.filename
      });
      console.log(`Seeded sticker: ${item.name}`);
    }
  }

  // Check products
  const count = await foodModel.countDocuments();
  if (count <= 1) {
    const defaultProducts = [
      {
        name: "Aura Premium Oversized Hoodie",
        description: "Heavyweight 450GSM french terry cotton hoodie. Perfect for custom embroidery & print lettering.",
        price: 1850,
        category: "Apparel",
        image: "1722865444288food_1.png",
        stickers: ["Golden Sparkle", "Aura Crown", "Neon Heart"]
      },
      {
        name: "Aura Signature Matte Ceramic Mug",
        description: "Minimalist ceramic mug with heat-resistant custom print coating and smooth matte finish.",
        price: 450,
        category: "Drinkware",
        image: "1722866109947food_9.png",
        stickers: ["Golden Sparkle", "Cosmic Butterfly"]
      },
      {
        name: "Aura Heavyweight Graphic Tee",
        description: "100% combed ringspun cotton tee with vintage washed aesthetic and double-needle stitching.",
        price: 950,
        category: "Apparel",
        image: "1722865738489food_5.png",
        stickers: ["Aura Flame", "Aura Crown", "Neon Heart"]
      },
      {
        name: "Aura Minimalist Insulated Tumbler",
        description: "Double-walled vacuum insulated stainless steel tumbler keeps drinks chilled for 24h or hot for 12h.",
        price: 850,
        category: "Drinkware",
        image: "1722866329894food_11.png",
        stickers: ["Golden Sparkle", "Cosmic Butterfly"]
      }
    ];

    for (const prod of defaultProducts) {
      await foodModel.create(prod);
      console.log(`Seeded product: ${prod.name}`);
    }
  }

  console.log("Seeding complete!");
  process.exit(0);
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});
