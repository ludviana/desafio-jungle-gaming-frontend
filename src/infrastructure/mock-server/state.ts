import type {
  CartItem,
  CreateOrderPayload,
  NFT,
  OrderReceipt,
  Session,
  UserProfile,
  Wallet,
} from '../../domain/entities';

import gorillaImage from '../../assets/nfts/gorilla.png';
import greenImage from '../../assets/nfts/green.png';
import purpleImage from '../../assets/nfts/purple.png';
import whiteImage from '../../assets/nfts/white.png';

const PROFILE_AVATAR = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200';
const CREATOR_AVATAR = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200';

const INITIAL_NFTS: NFT[] = [
  {
    id: 'emerald-ape-042',
    name: 'Emerald Ape #042',
    description: [
      'Um colecionável digital 1/50 finalizado à mão da coleção Kurio Editions,',
      'verificado na Ethereum, com arte desbloqueável e acesso para colecionadores.',
    ].join(' '),
    image: greenImage,
    gallery: [greenImage, greenImage, greenImage, greenImage],
    priceEth: '1.19',
    creator: { id: 'kurio-studio', name: 'Kurio Studio', avatar: CREATOR_AVATAR },
    owner: { id: 'user-lucas', name: 'Lucas', avatar: PROFILE_AVATAR },
    category: 'Arte digital',
    network: 'ethereum',
    tokenId: '#0042',
    collection: 'Kurio Apes',
    attributes: [
      { trait_type: 'Óculos', value: 'Esmeralda' },
      { trait_type: 'Raridade', value: 'Raro' },
    ],
    availableQuantity: 3,
    rating: '4.8',
    reviewCount: 19,
    version: 1,
  },
  {
    id: 'sage-nomad-009',
    name: 'Sage Nomad #009',
    description: 'Um viajante sábio da coleção Kurio Apes, com edição limitada e arte verificada.',
    image: purpleImage,
    gallery: [purpleImage, purpleImage, purpleImage, purpleImage],
    priceEth: '1.69',
    creator: { id: 'kurio-studio', name: 'Kurio Studio', avatar: CREATOR_AVATAR },
    owner: { id: 'user-aether', name: 'Aether Collect', avatar: PROFILE_AVATAR },
    category: 'Colecionáveis',
    network: 'polygon',
    tokenId: '#0009',
    collection: 'Kurio Apes',
    attributes: [
      { trait_type: 'Acessório', value: 'Chapéu de explorador' },
      { trait_type: 'Raridade', value: 'Épico' },
    ],
    availableQuantity: 5,
    rating: '4.7',
    reviewCount: 12,
    version: 1,
  },
  {
    id: 'neon-vessel-552',
    name: 'Neon Vessel #552',
    description: 'Arte digital selecionada da coleção Kurio Apes.',
    image: gorillaImage,
    gallery: [gorillaImage, gorillaImage, gorillaImage, gorillaImage],
    priceEth: '1.99',
    creator: { id: 'kurio-studio', name: 'Kurio Studio', avatar: CREATOR_AVATAR },
    owner: { id: 'user-aether', name: 'Aether Collect', avatar: PROFILE_AVATAR },
    category: 'Arte digital',
    network: 'ethereum',
    tokenId: '#0552',
    collection: 'Kurio Apes',
    attributes: [
      { trait_type: 'Traje', value: 'Marfim' },
      { trait_type: 'Raridade', value: 'Raro' },
    ],
    availableQuantity: 7,
    rating: '4.9',
    reviewCount: 22,
    version: 1,
  },
  {
    id: 'cosmic-bloom-118',
    name: 'Cosmic Bloom #118',
    description: 'Uma peça colecionável em tons de violeta.',
    image: purpleImage,
    gallery: [purpleImage, purpleImage, purpleImage, purpleImage],
    priceEth: '1.29',
    creator: { id: 'kurio-studio', name: 'Kurio Studio', avatar: CREATOR_AVATAR },
    owner: { id: 'user-lucas', name: 'Lucas', avatar: PROFILE_AVATAR },
    category: 'Arte 3D',
    network: 'polygon',
    tokenId: '#0118',
    collection: 'Kurio Apes',
    attributes: [
      { trait_type: 'Cor', value: 'Violeta' },
      { trait_type: 'Raridade', value: 'Comum' },
    ],
    availableQuantity: 11,
    rating: '4.6',
    reviewCount: 8,
    version: 1,
  },
  {
    id: 'violet-nomad-314',
    name: 'Violet Nomad #314',
    description: 'Um personagem viajante de edição limitada.',
    image: purpleImage,
    gallery: [purpleImage, purpleImage, purpleImage, purpleImage],
    priceEth: '1.39',
    creator: { id: 'kurio-studio', name: 'Kurio Studio', avatar: CREATOR_AVATAR },
    owner: { id: 'user-aether', name: 'Aether Collect', avatar: PROFILE_AVATAR },
    category: 'Colecionáveis',
    network: 'solana',
    tokenId: '#0314',
    collection: 'Kurio Apes',
    attributes: [
      { trait_type: 'Vestuário', value: 'Moletom violeta' },
      { trait_type: 'Raridade', value: 'Raro' },
    ],
    availableQuantity: 6,
    rating: '4.8',
    reviewCount: 15,
    version: 1,
  },
  {
    id: 'ivory-baron-088',
    name: 'Ivory Baron #088',
    description: 'Uma obra digital elegante da coleção Kurio Editions.',
    image: gorillaImage,
    gallery: [gorillaImage, gorillaImage, gorillaImage, gorillaImage],
    priceEth: '1.79',
    creator: { id: 'kurio-studio', name: 'Kurio Studio', avatar: CREATOR_AVATAR },
    owner: { id: 'user-lucas', name: 'Lucas', avatar: PROFILE_AVATAR },
    category: 'Arte digital',
    network: 'ethereum',
    tokenId: '#0088',
    collection: 'Kurio Apes',
    attributes: [
      { trait_type: 'Traje', value: 'Marfim' },
      { trait_type: 'Raridade', value: 'Épico' },
    ],
    availableQuantity: 9,
    rating: '4.9',
    reviewCount: 19,
    version: 1,
  },
  {
    id: 'golden-beat-207',
    name: 'Golden Beat #207',
    description: 'Música e arte digital em uma edição dourada.',
    image: whiteImage,
    gallery: [whiteImage, whiteImage, whiteImage, whiteImage],
    priceEth: '0.99',
    creator: { id: 'kurio-studio', name: 'Kurio Studio', avatar: CREATOR_AVATAR },
    owner: { id: 'user-aether', name: 'Aether Collect', avatar: PROFILE_AVATAR },
    category: 'Música',
    network: 'polygon',
    tokenId: '#0207',
    collection: 'Kurio Apes',
    attributes: [
      { trait_type: 'Acessório', value: 'Headphones' },
      { trait_type: 'Raridade', value: 'Comum' },
    ],
    availableQuantity: 4,
    rating: '4.5',
    reviewCount: 7,
    version: 1,
  },
  {
    id: 'golden-frequency-071',
    name: 'Golden Frequency #071',
    description: 'Uma edição musical colecionável da Kurio.',
    image: whiteImage,
    gallery: [whiteImage, whiteImage, whiteImage, whiteImage],
    priceEth: '0.59',
    creator: { id: 'kurio-studio', name: 'Kurio Studio', avatar: CREATOR_AVATAR },
    owner: { id: 'user-lucas', name: 'Lucas', avatar: PROFILE_AVATAR },
    category: 'Música',
    network: 'solana',
    tokenId: '#0071',
    collection: 'Kurio Apes',
    attributes: [
      { trait_type: 'Acessório', value: 'Headphones' },
      { trait_type: 'Raridade', value: 'Comum' },
    ],
    availableQuantity: 8,
    rating: '4.4',
    reviewCount: 6,
    version: 1,
  },
  {
    id: 'golden-signal-160',
    name: 'Golden Signal #160',
    description: 'Arte colecionável de uma edição especial.',
    image: whiteImage,
    gallery: [whiteImage, whiteImage, whiteImage, whiteImage],
    priceEth: '0.39',
    creator: { id: 'kurio-studio', name: 'Kurio Studio', avatar: CREATOR_AVATAR },
    owner: { id: 'user-aether', name: 'Aether Collect', avatar: PROFILE_AVATAR },
    category: 'Generativa',
    network: 'ethereum',
    tokenId: '#0160',
    collection: 'Kurio Apes',
    attributes: [
      { trait_type: 'Acessório', value: 'Headphones' },
      { trait_type: 'Raridade', value: 'Comum' },
    ],
    availableQuantity: 13,
    rating: '4.6',
    reviewCount: 10,
    version: 1,
  },
  {
    id: 'sunset-relay-101',
    name: 'Sunset Relay #101',
    description: 'Uma composição generativa em tons de pôr do sol.',
    image: greenImage,
    gallery: [greenImage, greenImage, greenImage, greenImage],
    priceEth: '0.89',
    creator: { id: 'kurio-studio', name: 'Kurio Studio', avatar: CREATOR_AVATAR },
    owner: { id: 'user-lucas', name: 'Lucas', avatar: PROFILE_AVATAR },
    category: 'Generativa',
    network: 'polygon',
    tokenId: '#0101',
    collection: 'Kurio Editions',
    attributes: [{ trait_type: 'Raridade', value: 'Comum' }],
    availableQuantity: 5,
    rating: '4.5',
    reviewCount: 9,
    version: 1,
  },
  {
    id: 'silver-signal-207',
    name: 'Silver Signal #207',
    description: 'Uma edição musical colecionável em prata.',
    image: whiteImage,
    gallery: [whiteImage, whiteImage, whiteImage, whiteImage],
    priceEth: '0.79',
    creator: { id: 'kurio-studio', name: 'Kurio Studio', avatar: CREATOR_AVATAR },
    owner: { id: 'user-aether', name: 'Aether Collect', avatar: PROFILE_AVATAR },
    category: 'Música',
    network: 'ethereum',
    tokenId: '#0207',
    collection: 'Kurio Editions',
    attributes: [{ trait_type: 'Raridade', value: 'Comum' }],
    availableQuantity: 6,
    rating: '4.6',
    reviewCount: 11,
    version: 1,
  },
  {
    id: 'digital-wave-330',
    name: 'Digital Wave #330',
    description: 'Uma obra digital inspirada em formas fluidas.',
    image: purpleImage,
    gallery: [purpleImage, purpleImage, purpleImage, purpleImage],
    priceEth: '1.09',
    creator: { id: 'kurio-studio', name: 'Kurio Studio', avatar: CREATOR_AVATAR },
    owner: { id: 'user-lucas', name: 'Lucas', avatar: PROFILE_AVATAR },
    category: 'Arte 3D',
    network: 'solana',
    tokenId: '#0330',
    collection: 'Kurio Editions',
    attributes: [{ trait_type: 'Raridade', value: 'Raro' }],
    availableQuantity: 4,
    rating: '4.7',
    reviewCount: 13,
    version: 1,
  },
];

const DEMO_PASSWORD_HASH = '5967c16c2022d4e40c36c348638237f3846e004c5f74dcde8aa0373f383aa8d4';
const INITIAL_USERS: Array<UserProfile & { passwordHash: string }> = [
  {
    id: 'user-lucas',
    name: 'Lucas Damasceno',
    username: 'lucas',
    email: 'lucas@kurio.test',
    avatar: PROFILE_AVATAR,
    ensName: 'lucas.kurio.eth',
    passwordHash: DEMO_PASSWORD_HASH,
  },
  {
    id: 'user-aether',
    name: 'Aether Collect',
    username: 'aether',
    email: 'aether@kurio.test',
    avatar: CREATOR_AVATAR,
    ensName: 'aether.kurio.eth',
    passwordHash: DEMO_PASSWORD_HASH,
  },
];

const INITIAL_WALLETS: Wallet[] = [
  {
    id: 'wallet-primary',
    label: 'Principal',
    address: '0xA91F...E82C',
    ensName: 'nova.kurio.eth',
    network: 'ethereum',
    provider: 'MetaMask',
    isPrimary: true,
  },
  {
    id: 'wallet-secondary',
    label: 'Reserva',
    address: '0x72A4...19E8',
    ensName: 'reserva.kurio.eth',
    network: 'polygon',
    provider: 'Coinbase Wallet',
    isPrimary: false,
  },
];

export interface StoredOrder {
  payload: CreateOrderPayload;
  receipt: OrderReceipt;
  userId: string;
}

export const STORAGE_KEY = 'kurio_mock_state_v2';

export interface MockState {
  nfts: NFT[];
  users: Array<UserProfile & { passwordHash: string }>;
  sessions: Record<string, Session>;
  favorites: Record<string, string[]>;
  carts: Record<string, CartItem[]>;
  coupons: Record<string, string>;
  wallets: Record<string, Wallet[]>;
  orders: Record<string, StoredOrder>;
}

export function createInitialState(): MockState {
  return {
    nfts: INITIAL_NFTS,
    users: INITIAL_USERS,
    sessions: {},
    favorites: {},
    carts: { guest: [] },
    coupons: {},
    wallets: {
      'user-lucas': INITIAL_WALLETS,
      'user-aether': INITIAL_WALLETS.map((wallet) => ({ ...wallet, id: `${wallet.id}-aether` })),
    },
    orders: {},
  };
}
