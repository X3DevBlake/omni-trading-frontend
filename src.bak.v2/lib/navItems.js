import { Wallet, TrendingUp, Droplet, Sprout, Gauge, CreditCard, Trophy, BarChart3, Repeat } from "lucide-react";

export const NAV_ITEMS = [
  { id:"markets",     label:"Markets",    icon:BarChart3,   group:"trade" },
  { id:"swap",        label:"Swap",       icon:Repeat,      group:"trade" },
  { id:"spot",        label:"Spot",       icon:TrendingUp,  group:"trade" },
  { id:"futures",     label:"Futures",    icon:Gauge,       group:"trade" },
  { id:"liquidity",   label:"Liquidity",  icon:Droplet,     group:"earn"  },
  { id:"farms",       label:"Farms",      icon:Sprout,      group:"earn"  },
  { id:"rewards",     label:"Rewards",    icon:Trophy,      group:"earn"  },
  { id:"portfolio",   label:"Portfolio",  icon:Wallet,      group:"account" },
  { id:"buy",         label:"Buy Crypto", icon:CreditCard,  group:"account" },
];
