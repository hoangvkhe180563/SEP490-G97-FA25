import { Button } from '@/common/components/ui/button'
import type { IBannerProps } from '../interfaces/IBannerProps'

const Banner = (props: IBannerProps) => {
  return (
    <div className='relative w-full h-[400px]'>
      <div className={`absolute inset-0 flex justify-center opacity-40 ${props.background}`}>
        <img className='w-3/4 h-full' src={props.image} />
      </div>
      <div className='absolute left-3/4 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center'>
        <img className='w-[500px] h-[200px] mb-3' src={props.logo} />
        <Button className={`${props.background} hover:${props.background}`}>
          HỌC THỬ MIỄN PHÍ
        </Button>
      </div>
    </div>
  )
}

export default Banner