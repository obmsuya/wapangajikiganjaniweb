import * as React from "react"

export function useCountdown() {
  const [secondsLeft, setSecondsLeft] = React.useState(0)

  React.useEffect(() => {
    if (secondsLeft <= 0) return
    const timer = setTimeout(() => setSecondsLeft((seconds) => seconds - 1), 1000)
    return () => clearTimeout(timer)
  }, [secondsLeft])

  return [secondsLeft, setSecondsLeft]
}
