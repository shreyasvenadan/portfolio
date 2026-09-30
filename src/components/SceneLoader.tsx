import { useProgress } from '@react-three/drei'

// Small progress note while the 3D scene and avatar download.
export default function SceneLoader() {
  const { active, progress } = useProgress()
  if (!active) return null
  return (
    <p role="status" className="fixed right-5 bottom-5 z-20 font-display text-sm text-muted md:right-10 md:bottom-8">
      Loading 3D scene, {Math.round(progress)}%
    </p>
  )
}
