import { Vector3 } from 'three'

// The point the depth of field keeps sharp. The camera rig moves it per section:
// on the character in the hero and contact, near the lens elsewhere so the
// character melts into a soft blur behind the text.
export const focusPoint = new Vector3(0, 1.4, 0)
