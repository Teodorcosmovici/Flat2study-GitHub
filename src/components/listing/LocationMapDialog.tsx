import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MapPin } from "lucide-react";
import SimpleMapView from "@/components/map/SimpleMapView";
import { Listing } from "@/types";

interface LocationMapDialogProps {
  listing: Listing;
}

export const LocationMapDialog = ({ listing }: LocationMapDialogProps) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          View on map
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl w-full">
        <DialogHeader>
          <DialogTitle>Location</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-muted-foreground">
            📍 {listing.addressLine}, {listing.city}, {listing.country}
          </p>
          <div className="h-96 w-full overflow-hidden rounded-lg">
            <SimpleMapView 
              listings={[listing]}
              className="h-full w-full relative z-0"
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};