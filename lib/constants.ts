import {
  Wifi,
  Utensils,
  Waves,
  Wind,
  Car,
  WashingMachine,
  Tv,
  Flame,
  Briefcase,
  Dumbbell,
  Dog,
  Bath,
  Trees,
  type LucideIcon,
} from "lucide-react";
import type { PropertyType } from "@/lib/database.types";

export const AMENITIES: string[] = [
  "Wifi",
  "Kitchen",
  "Pool",
  "Air conditioning",
  "Free parking",
  "Washer",
  "Hot tub",
  "Workspace",
  "TV",
  "Heating",
  "Beach access",
  "Pets allowed",
  "Gym",
  "BBQ grill",
  "Fireplace",
];

export const AMENITY_ICONS: Record<string, LucideIcon> = {
  Wifi: Wifi,
  Kitchen: Utensils,
  Pool: Waves,
  "Air conditioning": Wind,
  "Free parking": Car,
  Washer: WashingMachine,
  "Hot tub": Bath,
  Workspace: Briefcase,
  TV: Tv,
  Heating: Flame,
  "Beach access": Waves,
  "Pets allowed": Dog,
  Gym: Dumbbell,
  "BBQ grill": Flame,
  Fireplace: Flame,
  Garden: Trees,
};

export const PROPERTY_TYPES: { value: PropertyType; label: string }[] = [
  { value: "apartment", label: "Apartment" },
  { value: "house", label: "House" },
  { value: "villa", label: "Villa" },
  { value: "room", label: "Room" },
  { value: "cabin", label: "Cabin" },
  { value: "loft", label: "Loft" },
  { value: "cottage", label: "Cottage" },
];

export const PROPERTY_TYPE_LABELS: Record<PropertyType, string> =
  Object.fromEntries(PROPERTY_TYPES.map((p) => [p.value, p.label])) as Record<
    PropertyType,
    string
  >;
