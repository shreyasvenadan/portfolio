import { useSyncExternalStore } from 'react'
import { isNight, subscribeNight, toggleNight } from '../lib/night'
import { MoonIcon, SunIcon } from './Header'

// Night mode as a hook, for the pages whose scenes are built for one or the
// other: they rebuild when it changes.
export const useNight = () => useSyncExternalStore(subscribeNight, isNight)

// The sun or moon in the corner of a page's scene, switching between day and
// night. It shows what you'd switch to: the moon by day, the sun by night.
export default function NightSwitch() {
  const night = useNight()
  return (
    <button
      type="button"
      onClick={toggleNight}
      aria-pressed={night}
      aria-label={night ? 'Switch to day' : 'Switch to night'}
      title={night ? 'Switch to day' : 'Switch to night'}
      className="dive-night"
    >
      {night ? <SunIcon /> : <MoonIcon />}
    </button>
  )
}
