import { useState, useEffect } from 'react'

const messages = [
  'Analyzing your style',
  'Matching color palettes',
  'Layering the pieces',
  'Checking the vibe',
  'Styling the outfit',
  'Adding finishing touches',
  'Almost runway ready',
]

function LoadingState() {
  const [index, setIndex] = useState(0)
  const [dots, setDots] = useState('')

  useEffect(() => {
    const dotInterval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? '' : prev + '.'))
    }, 400)
    return () => clearInterval(dotInterval)
  }, [])

  useEffect(() => {
    const msgInterval = setInterval(() => {
      setIndex((prev) => (prev + 1) % messages.length)
    }, 2800)
    return () => clearInterval(msgInterval)
  }, [])

  return (
    <div className="loading-state">
      <div className="loading-orb">
        <div className="orb-core"></div>
        <div className="orb-ring orb-ring-1"></div>
        <div className="orb-ring orb-ring-2"></div>
        <div className="orb-ring orb-ring-3"></div>
      </div>
      <p className="loading-message" key={index}>
        {messages[index]}{dots}
      </p>
    </div>
  )
}

export default LoadingState
