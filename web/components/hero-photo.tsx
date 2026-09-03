'use client'

import { useEffect, useState } from 'react'

const IMAGES = ['/hero1.png', '/hero2.png', '/hero3.png', '/hero4.png']

export function HeroPhoto() {
  const [src, setSrc] = useState(IMAGES[0])

  useEffect(() => {
    setSrc(IMAGES[Math.floor(Math.random() * IMAGES.length)])
  }, [])

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      className="h-full w-full object-cover object-[70%_20%]"
    />
  )
}
