import dynamic from 'next/dynamic'

const ShaderShowcase = dynamic(() => import('@/components/ui/hero'), { ssr: false })

export default function DemoOne() {
  return (
    <div className="min-h-screen h-full w-full">
      <ShaderShowcase />
    </div>
  )
}
