import { useEffect, useRef, type ReactNode } from 'react'

interface Item {
  id: string
}
interface Props {
  items: Item[]
  index: number
  onIndex: (i: number) => void
  renderItem: (itemIndex: number, active: boolean) => ReactNode
}

/**
 * 卡带横向轮播：手机可手指左右滑动浏览；松手后自动把最靠近中间的卡带设为当前；
 * 当前卡带变化时会平滑滚动到正中。桌面端保留左右箭头与圆点。
 */
export default function CartridgeCarousel({ items, index, onIndex, renderItem }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const itemRefs = useRef<(HTMLDivElement | null)[]>([])
  const indexRef = useRef(index)
  const programmatic = useRef(false)

  indexRef.current = index

  // 当前卡带变化时，平滑滚动到正中
  useEffect(() => {
    programmatic.current = true
    const el = itemRefs.current[index]
    el?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
    const t = setTimeout(() => (programmatic.current = false), 480)
    return () => clearTimeout(t)
  }, [index])

  // 滑动结束后，拾取最靠近中间的卡带
  const settle = () => {
    if (programmatic.current) return
    const sc = scrollRef.current
    if (!sc) return
    const center = sc.scrollLeft + sc.clientWidth / 2
    let best = indexRef.current
    let bestDist = Infinity
    itemRefs.current.forEach((el, i) => {
      if (!el) return
      const c = el.offsetLeft + el.offsetWidth / 2
      const d = Math.abs(c - center)
      if (d < bestDist) {
        bestDist = d
        best = i
      }
    })
    if (best !== indexRef.current) onIndex(best)
  }

  // scrollend（现代浏览器）原生监听，最稳；无则回退到 touchend
  useEffect(() => {
    const sc = scrollRef.current
    if (!sc) return
    const handler = () => requestAnimationFrame(settle)
    sc.addEventListener('scrollend', handler)
    return () => sc.removeEventListener('scrollend', handler)
  }, [])

  return (
    <div
      ref={scrollRef}
      onTouchEnd={() => setTimeout(settle, 120)}
      className="flex snap-x snap-mandatory items-end gap-3 overflow-x-auto overflow-y-hidden pb-3 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
    >
      {items.map((it, i) => (
        <div key={it.id} ref={(el) => (itemRefs.current[i] = el)} className="snap-center shrink-0">
          {renderItem(i, i === index)}
        </div>
      ))}
    </div>
  )
}
