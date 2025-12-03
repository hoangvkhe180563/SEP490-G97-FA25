import React, { useEffect, useState } from 'react'
import type { IIntroductionProps } from '../interfaces/IIntroductionProps'
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from '@/common/components/ui/carousel'
import { Card, CardContent } from '@/common/components/ui/card'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import Autoplay from 'embla-carousel-autoplay'

const Introduction = (props: IIntroductionProps) => {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!api) {
      return;
    }

    setCurrent(api.selectedScrollSnap());

    api.on("select", () => {
      setCurrent(api.selectedScrollSnap());
    });
  }, [api]);

  const scrollTo = (index: number) => {
    api?.scrollTo(index);
  };

  const plugin = React.useRef(
    Autoplay({ delay: 2000, stopOnInteraction: true })
  );

  return (
    <div className='w-full flex flex-col items-center'>
      <div className='w-4/5'>
        <h1 className='text-2xl py-2 font-bold text-center'>GIỚI THIỆU TRANG WEB</h1>
        <div className='flex gap-8 h-[300px]'>
          <div className='w-1/2 flex flex-col items-center leading-8'>
            <div className='text-justify mb-3'>
              {props.description}
            </div>
          </div>
          <Carousel plugins={[plugin.current]} opts={{
            loop: true,
          }} setApi={setApi} onMouseEnter={plugin.current.stop} onMouseLeave={() => plugin.current.play()} className='w-1/2 h-[280px] relative flex flex-col items-center'>
            <CarouselContent>
              {props.introductionImage && Array.from(props.introductionImage).map((image, index) => (
                <CarouselItem key={index}>
                  <div>
                    <Card className="rounded-none p-0">
                      <CardContent className="flex items-center justify-center p-0">
                        <img src={image} className='w-full h-full' />
                      </CardContent>
                    </Card>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <button
              className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full disabled:opacity-50 bg-white"
              onClick={() => api?.scrollPrev()}
              disabled={!api?.canScrollPrev()}
            >
              <ChevronLeft className="h-6 w-6" />
            </button>

            <button
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full disabled:opacity-50 bg-white"
              onClick={() => api?.scrollNext()}
              disabled={!api?.canScrollNext()}
            >
              <ChevronRight className="h-6 w-6" />
            </button>

            <div className="flex justify-center gap-2 mt-4">
              {props.introductionImage && Array.from(props.introductionImage).map((_, index) => (
                <button
                  key={index}
                  className={`h-2 w-2 rounded-full transition-all ${current === index ? `bg-blue-300` : "bg-gray-300"}`}
                  onClick={() => scrollTo(index)}
                />
              ))}
            </div>
          </Carousel>
        </div>
      </div>
    </div>
  )
}

export default Introduction