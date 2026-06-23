export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      bookings: {
        Row: {
          check_in: string;
          check_out: string;
          cleaning_fee: number;
          created_at: string;
          guest_id: string;
          guests: number;
          id: string;
          listing_id: string;
          nightly_total: number;
          nights: number;
          room_instance_id: string | null;
          room_type_id: string | null;
          service_fee: number;
          status: Database["public"]["Enums"]["booking_status"];
          total_price: number;
        };
        Insert: {
          check_in: string;
          check_out: string;
          cleaning_fee?: number;
          created_at?: string;
          guest_id: string;
          guests?: number;
          id?: string;
          listing_id: string;
          nightly_total: number;
          nights: number;
          room_instance_id?: string | null;
          room_type_id?: string | null;
          service_fee?: number;
          status?: Database["public"]["Enums"]["booking_status"];
          total_price: number;
        };
        Update: Partial<Database["public"]["Tables"]["bookings"]["Insert"]>;
        Relationships: [];
      };
      room_types: {
        Row: {
          id: string;
          listing_id: string;
          name: string;
          description: string;
          price_per_night: number;
          cleaning_fee: number;
          max_guests: number;
          beds: number;
          bathrooms: number;
          size_sqm: number | null;
          amenities: string[];
          position: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          listing_id: string;
          name: string;
          description?: string;
          price_per_night: number;
          cleaning_fee?: number;
          max_guests?: number;
          beds?: number;
          bathrooms?: number;
          size_sqm?: number | null;
          amenities?: string[];
          position?: number;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["room_types"]["Insert"]>;
        Relationships: [];
      };
      room_instances: {
        Row: { id: string; room_type_id: string; label: string };
        Insert: { id?: string; room_type_id: string; label?: string };
        Update: Partial<Database["public"]["Tables"]["room_instances"]["Insert"]>;
        Relationships: [];
      };
      favorites: {
        Row: { created_at: string; listing_id: string; user_id: string };
        Insert: { created_at?: string; listing_id: string; user_id: string };
        Update: Partial<Database["public"]["Tables"]["favorites"]["Insert"]>;
        Relationships: [];
      };
      listing_photos: {
        Row: { id: string; listing_id: string; position: number; url: string };
        Insert: { id?: string; listing_id: string; position?: number; url: string };
        Update: Partial<Database["public"]["Tables"]["listing_photos"]["Insert"]>;
        Relationships: [];
      };
      listings: {
        Row: {
          address: string | null;
          amenities: string[];
          bathrooms: number;
          bedrooms: number;
          beds: number;
          city: string;
          cleaning_fee: number;
          country: string;
          created_at: string;
          description: string;
          host_id: string;
          id: string;
          lat: number | null;
          lng: number | null;
          max_guests: number;
          price_per_night: number;
          property_type: Database["public"]["Enums"]["property_type"];
          service_fee_pct: number;
          status: Database["public"]["Enums"]["listing_status"];
          title: string;
        };
        Insert: {
          address?: string | null;
          amenities?: string[];
          bathrooms?: number;
          bedrooms?: number;
          beds?: number;
          city: string;
          cleaning_fee?: number;
          country: string;
          created_at?: string;
          description?: string;
          host_id: string;
          id?: string;
          lat?: number | null;
          lng?: number | null;
          max_guests?: number;
          price_per_night: number;
          property_type?: Database["public"]["Enums"]["property_type"];
          service_fee_pct?: number;
          status?: Database["public"]["Enums"]["listing_status"];
          title: string;
        };
        Update: Partial<Database["public"]["Tables"]["listings"]["Insert"]>;
        Relationships: [];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          bio: string | null;
          created_at: string;
          full_name: string | null;
          id: string;
          is_host: boolean;
        };
        Insert: {
          avatar_url?: string | null;
          bio?: string | null;
          created_at?: string;
          full_name?: string | null;
          id: string;
          is_host?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [];
      };
      reviews: {
        Row: {
          author_id: string;
          booking_id: string | null;
          comment: string;
          created_at: string;
          id: string;
          listing_id: string;
          rating: number;
        };
        Insert: {
          author_id: string;
          booking_id?: string | null;
          comment?: string;
          created_at?: string;
          id?: string;
          listing_id: string;
          rating: number;
        };
        Update: Partial<Database["public"]["Tables"]["reviews"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      is_listing_available: {
        Args: { p_check_in: string; p_check_out: string; p_listing_id: string };
        Returns: boolean;
      };
      room_type_availability: {
        Args: {
          p_room_type_id: string;
          p_check_in: string;
          p_check_out: string;
        };
        Returns: number;
      };
      book_room_instance: {
        Args: {
          p_room_type_id: string;
          p_check_in: string;
          p_check_out: string;
          p_guests: number;
          p_nights: number;
          p_nightly_total: number;
          p_cleaning_fee: number;
          p_service_fee: number;
          p_total: number;
        };
        Returns: string;
      };
    };
    Enums: {
      booking_status: "pending" | "confirmed" | "cancelled";
      listing_status: "draft" | "published";
      property_type:
        | "apartment"
        | "house"
        | "villa"
        | "room"
        | "cabin"
        | "loft"
        | "cottage";
    };
    CompositeTypes: Record<string, never>;
  };
};

type PublicSchema = Database["public"];
export type Tables<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Row"];
export type Enums<T extends keyof PublicSchema["Enums"]> =
  PublicSchema["Enums"][T];

export type Listing = Tables<"listings">;
export type ListingPhoto = Tables<"listing_photos">;
export type Booking = Tables<"bookings">;
export type Profile = Tables<"profiles">;
export type Review = Tables<"reviews">;
export type Favorite = Tables<"favorites">;
export type RoomType = Tables<"room_types">;
export type RoomInstance = Tables<"room_instances">;
export type PropertyType = Enums<"property_type">;
export type BookingStatus = Enums<"booking_status">;
