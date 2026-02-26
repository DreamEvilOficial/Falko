'use client'

import { useState } from 'react'
import { 
  Shirt, 
  Scissors, 
  Watch, 
  Glasses, 
  Crown, 
  Heart, 
  Star, 
  Zap,
  ShoppingBag,
  Sparkles,
  Gift,
  Award,
  Tag,
  TrendingUp,
  Flame,
  Sun,
  Moon,
  Cloud,
  Flower,
  Leaf,
  Coffee,
  Music,
  Camera,
  Headphones,
  Smile,
  Diamond,
  Feather,
  Eye,
  Hand,
  Footprints,
  ShirtIcon as TShirt,
  X,
  Gem,
  Palette,
  Umbrella,
  Cherry,
  Apple,
  IceCream,
  Candy,
  Pizza,
  Cake,
  Cookie,
  Waves,
  Mountain,
  TreePine,
  Snowflake,
  Droplet,
  Wind,
  Gamepad2,
  Rocket,
  Plane,
  Car,
  Bike,
  Shell,
  Fish,
  Bug,
  Bird,
  Cat,
  Dog,
  Rabbit,
  Squirrel,
  Briefcase,
  Backpack,
  PersonStanding,
  Baby,
  User,
  Users,
  Footprints as Shoes,
  Sparkle,
  Luggage,
  Wallet,
  BadgePercent,
  Percent,
  CircleDollarSign,
  DollarSign,
  Armchair as Pants,
  Wind as Windbreaker,
  CloudRain as Raincoat,
  Snowflake as Winter,
  Sun as Summer,
  Mail,
  MessageCircle,
  Phone as PhoneIcon,
  Layers,
  Box,
  Package
} from 'lucide-react'

// Iconos personalizados para ropa usando componentes disponibles
const Jeans = Layers // Capas para representar jeans (tela gruesa)
const Hoodie = Box // Caja para representar buzos con capucha
const Sweater = Package // Paquete para suéteres
const Necklace = Sparkles // Para accesorios/joyería
const Ring = Diamond // Para anillos/accesorios
const Hat = Crown // Para gorras/sombreros
const Belt = Wind // Para cinturones
const Scarf = Feather // Para bufandas

const icons = [
  { name: 'TShirt', Icon: TShirt },
  { name: 'Shirt', Icon: Shirt },
  { name: 'Hoodie', Icon: Hoodie },
  { name: 'Sweater', Icon: Sweater },
  { name: 'Jeans', Icon: Jeans },
  { name: 'Pants', Icon: Pants },
  { name: 'Shoes', Icon: Shoes },
  { name: 'Watch', Icon: Watch },
  { name: 'Glasses', Icon: Glasses },
  { name: 'Hat', Icon: Hat },
  { name: 'Belt', Icon: Belt },
  { name: 'Scarf', Icon: Scarf },
  { name: 'Necklace', Icon: Necklace },
  { name: 'Ring', Icon: Ring },
  { name: 'Backpack', Icon: Backpack },
  { name: 'Briefcase', Icon: Briefcase },
  { name: 'ShoppingBag', Icon: ShoppingBag },
  { name: 'Wallet', Icon: Wallet },
  { name: 'Crown', Icon: Crown },
  { name: 'Scissors', Icon: Scissors },
  { name: 'Heart', Icon: Heart },
  { name: 'Star', Icon: Star },
  { name: 'Zap', Icon: Zap },
  { name: 'Sparkles', Icon: Sparkles },
  { name: 'Sparkle', Icon: Sparkle },
  { name: 'Gift', Icon: Gift },
  { name: 'Award', Icon: Award },
  { name: 'Tag', Icon: Tag },
  { name: 'TrendingUp', Icon: TrendingUp },
  { name: 'Flame', Icon: Flame },
  { name: 'BadgePercent', Icon: BadgePercent },
  { name: 'Percent', Icon: Percent },
  { name: 'DollarSign', Icon: DollarSign },
  { name: 'CircleDollarSign', Icon: CircleDollarSign },
  { name: 'PersonStanding', Icon: PersonStanding },
  { name: 'User', Icon: User },
  { name: 'Users', Icon: Users },
  { name: 'Baby', Icon: Baby },
  { name: 'Luggage', Icon: Luggage },
  { name: 'Winter', Icon: Winter },
  { name: 'Summer', Icon: Summer },
  { name: 'Windbreaker', Icon: Windbreaker },
  { name: 'Raincoat', Icon: Raincoat },
  { name: 'Sun', Icon: Sun },
  { name: 'Moon', Icon: Moon },
  { name: 'Cloud', Icon: Cloud },
  { name: 'Flower', Icon: Flower },
  { name: 'Leaf', Icon: Leaf },
  { name: 'Coffee', Icon: Coffee },
  { name: 'Music', Icon: Music },
  { name: 'Camera', Icon: Camera },
  { name: 'Headphones', Icon: Headphones },
  { name: 'Smile', Icon: Smile },
  { name: 'Diamond', Icon: Diamond },
  { name: 'Gem', Icon: Gem },
  { name: 'Feather', Icon: Feather },
  { name: 'Eye', Icon: Eye },
  { name: 'Hand', Icon: Hand },
  { name: 'Footprints', Icon: Footprints },
  { name: 'Palette', Icon: Palette },
  { name: 'Umbrella', Icon: Umbrella },
  { name: 'Cherry', Icon: Cherry },
  { name: 'Apple', Icon: Apple },
  { name: 'IceCream', Icon: IceCream },
  { name: 'Candy', Icon: Candy },
  { name: 'Pizza', Icon: Pizza },
  { name: 'Cake', Icon: Cake },
  { name: 'Cookie', Icon: Cookie },
  { name: 'Waves', Icon: Waves },
  { name: 'Mountain', Icon: Mountain },
  { name: 'TreePine', Icon: TreePine },
  { name: 'Snowflake', Icon: Snowflake },
  { name: 'Droplet', Icon: Droplet },
  { name: 'Wind', Icon: Wind },
  { name: 'Gamepad2', Icon: Gamepad2 },
  { name: 'Rocket', Icon: Rocket },
  { name: 'Plane', Icon: Plane },
  { name: 'Car', Icon: Car },
  { name: 'Bike', Icon: Bike },
  { name: 'Shell', Icon: Shell },
  { name: 'Fish', Icon: Fish },
  { name: 'Bug', Icon: Bug },
  { name: 'Bird', Icon: Bird },
  { name: 'Cat', Icon: Cat },
  { name: 'Dog', Icon: Dog },
  { name: 'Rabbit', Icon: Rabbit },
  { name: 'Squirrel', Icon: Squirrel },
  { name: 'Mail', Icon: Mail },
  { name: 'MessageCircle', Icon: MessageCircle },
  { name: 'PhoneIcon', Icon: PhoneIcon }
]

interface IconSelectorProps {
  selectedIcon: string
  onSelect: (iconName: string) => void
  onClose: () => void
}

export default function IconSelector({ selectedIcon, onSelect, onClose }: IconSelectorProps) {
  const [search, setSearch] = useState('')

  const filteredIcons = icons.filter(icon => 
    icon.name.toLowerCase().includes(search.toLowerCase())
  )

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={handleOverlayClick}
    >
      <div className="bg-secondary border border-white/10 rounded-3xl p-6 max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-black tracking-tight text-white">Seleccionar Icono</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/5 rounded-full transition"
          >
            <X className="w-5 h-5 text-white/60" />
          </button>
        </div>

        {/* Search */}
        <input
          type="text"
          placeholder="Buscar icono..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-4 py-2 border border-white/10 bg-white/[0.04] rounded-2xl mb-4 text-white placeholder:text-white/25 outline-none focus:border-white/25 transition-colors"
        />

        {/* Icons Grid */}
        <div className="overflow-y-auto flex-1">
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
            {filteredIcons.map(({ name, Icon }) => (
              <button
                key={name}
                onClick={() => {
                  onSelect(name)
                  onClose()
                }}
                className={`p-4 rounded-xl border-2 transition-all hover:scale-110 ${
                  selectedIcon === name
                    ? 'border-accent bg-accent/10'
                    : 'border-white/10 hover:border-white/30'
                }`}
                title={name}
              >
                <Icon className={`w-6 h-6 ${selectedIcon === name ? 'text-accent' : 'text-white/70'}`} />
              </button>
            ))}
          </div>
        </div>

        {/* Info */}
        <p className="text-xs text-white/40 mt-4 text-center">
          {filteredIcons.length} icono{filteredIcons.length !== 1 ? 's' : ''} disponible{filteredIcons.length !== 1 ? 's' : ''}
        </p>
      </div>
    </div>
  )
}

// Componente para renderizar el icono por nombre
export function CategoryIcon({ iconName, className = "w-5 h-5" }: { iconName: string | undefined, className?: string }) {
  const iconData = icons.find(i => i.name === iconName)
  if (!iconData || !iconName) return null
  
  const Icon = iconData.Icon
  return <Icon className={className} />
}
