import { Card, CardContent } from "@/common/components/ui/card"
import type { IFeaturedTeacher } from "../interfaces/IFeaturedTeacher"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/common/components/ui/carousel"

const FeaturedTeachers = (props: { data: IFeaturedTeacher[] }) => {
  return (
    <div className="w-full flex flex-col items-center">
      <h1 className='mt-5 text-2xl py-2 font-bold text-center'>ĐỘI NGŨ GIÁO VIÊN</h1>
      <div className="w-3/5 my-3">
        <Carousel opts={{slidesToScroll: "auto"}}>
          <CarouselContent>
            {props.data.map((item, index) =>
              <CarouselItem key={index} className="basis-1/4">
                <Card>
                  <CardContent className="flex flex-col items-center p-6">
                    <img className="w-1/2 rounded-full" src={item.image} alt={item.name} />
                    <div className="text-lg font-bold my-2">{item.name}</div>
                    <div>{item.role}</div>
                  </CardContent>
                </Card>
              </CarouselItem>
            )}
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>
      </div>
    </div>
  )
}

export default FeaturedTeachers