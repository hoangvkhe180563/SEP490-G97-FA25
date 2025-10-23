import type { IFeaturedTeacher } from "../interfaces/IFeaturedTeacher";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/common/components/ui/carousel";

const FeaturedTeachers = ({ data }: { data: IFeaturedTeacher[] }) => {
  const items = data ?? [];
  return (
    <Carousel>
      <CarouselContent>
        {items.length === 0 ? (
          <CarouselItem>...</CarouselItem>
        ) : (
          items.map((t, i) => <CarouselItem key={i}>{t.name}</CarouselItem>)
        )}
      </CarouselContent>
      <CarouselPrevious />
      <CarouselNext />
    </Carousel>
  );
};

export default FeaturedTeachers;
