import { Settings } from 'lucide-react'
import type { IBannerProps } from '../interfaces/IBannerProps'

const Banner = (props: IBannerProps) => {
  return (
    <div className='relative w-full h-[400px]'>
      <div className={`absolute inset-0 flex justify-center opacity-40`}>
        <img className='w-full h-full' src={props.image} />
      </div>
      <div className='absolute left-3/4 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center'>
        <img className='w-[500px] h-[200px] mb-3' src={props.logo} />
        <button className='bg-sky-300 text-black flex gap-3 px-2 py-2 rounded-md items-center cursor-pointer' onClick={() => location.href = '/ui/landing-page'}><Settings/> Cấu hình giao diện</button>
      </div>
    </div>
  )
}

export default Banner