import { useState, useEffect } from 'react'
import { Zap, Clock, Battery, MapPin, Square } from 'lucide-react'
import type { SessionData } from './PreAuth'

interface LiveSessionProps {
  session: SessionData
  onStop: (kWhUsed: number, totalAmount: number) => void
}

export default function LiveSession({ session, onStop }: LiveSessionProps) {
  const [secondsElapsed, setSecondsElapsed] = useState(0)
  const [kWhUsed, setKWhUsed] = useState(0)
  const [battery, setBattery] = useState(45)
  const [showStopConfirm, setShowStopConfirm] = useState(false)

  const RATE = session.charger.ratePerUnit        // ₹8 per kWh
  const PLATFORM_FEE = session.charger.platformFee // ₹8 flat
  const KWH_PER_SECOND = 50 / 3600               // 50kW charger speed

  // Running cost calculation
  const energyCost = kWhUsed * RATE
  const totalCost = energyCost + PLATFORM_FEE

  // Time formatting
  const minutes = Math.floor(secondsElapsed / 60)
  const seconds = secondsElapsed % 60
  const timeDisplay = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`

  // Estimated time remaining (to reach 100% battery)
  const batteryRemaining = 100 - battery
  const kWhRemaining = (batteryRemaining / 100) * 40  // assuming 40kWh battery
  const secondsRemaining = kWhRemaining / KWH_PER_SECOND
  const minsRemaining = Math.floor(secondsRemaining / 60)

  // Live ticker — updates every second
  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsElapsed(prev => prev + 1)
      setKWhUsed(prev => parseFloat((prev + KWH_PER_SECOND).toFixed(4)))
      setBattery(prev => Math.min(100, parseFloat((prev + 0.004).toFixed(1))))
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  const handleStop = () => {
    onStop(parseFloat(kWhUsed.toFixed(2)), parseFloat(totalCost.toFixed(2)))
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-100">

        {/* Header */}
        <div className="bg-emerald-600 rounded-t-2xl px-5 py-4 flex items-center justify-between">
          <div>
            <p className="text-emerald-100 text-xs">CHARGE-GRID</p>
            <h1 className="text-white font-medium text-lg">Live Session</h1>
          </div>
          {/* Live indicator */}
          <div className="flex items-center gap-2 bg-emerald-700 px-3 py-1.5 rounded-full">
            <div className="w-2 h-2 bg-green-300 rounded-full animate-pulse" />
            <span className="text-white text-xs font-medium">LIVE</span>
          </div>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 pt-4">
          <div className="w-2 h-1.5 bg-emerald-200 rounded-full" />
          <div className="w-6 h-1.5 bg-emerald-600 rounded-full" />
          <div className="w-2 h-1.5 bg-gray-200 rounded-full" />
          <div className="w-2 h-1.5 bg-gray-200 rounded-full" />
          <div className="w-2 h-1.5 bg-gray-200 rounded-full" />
        </div>

        <div className="p-5 space-y-4">

          {/* Live cost meter — main focus */}
          <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5 text-center">
            <p className="text-xs text-emerald-600 mb-1">Running total</p>
            <p className="text-5xl font-semibold text-emerald-700">
              ₹{totalCost.toFixed(2)}
            </p>
            <p className="text-xs text-emerald-500 mt-2">
              Updates every second · includes ₹{PLATFORM_FEE} platform fee
            </p>
          </div>

          {/* 4 stat cards */}
          <div className="grid grid-cols-2 gap-3">

            <div className="bg-gray-50 rounded-xl p-3 flex items-center gap-3">
              <div className="bg-blue-100 p-2 rounded-lg">
                <Zap size={16} className="text-blue-600" />
              </div>
              <div>
                <p className="text-base font-semibold text-gray-800">
                  {kWhUsed.toFixed(3)}
                </p>
                <p className="text-xs text-gray-400">kWh used</p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-3 flex items-center gap-3">
              <div className="bg-purple-100 p-2 rounded-lg">
                <Clock size={16} className="text-purple-600" />
              </div>
              <div>
                <p className="text-base font-semibold text-gray-800">{timeDisplay}</p>
                <p className="text-xs text-gray-400">elapsed</p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-3 flex items-center gap-3">
              <div className="bg-amber-100 p-2 rounded-lg">
                <Clock size={16} className="text-amber-600" />
              </div>
              <div>
                <p className="text-base font-semibold text-gray-800">~{minsRemaining} min</p>
                <p className="text-xs text-gray-400">remaining</p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-3 flex items-center gap-3">
              <div className="bg-green-100 p-2 rounded-lg">
                <Battery size={16} className="text-green-600" />
              </div>
              <div>
                <p className="text-base font-semibold text-gray-800">{battery.toFixed(1)}%</p>
                <p className="text-xs text-gray-400">battery</p>
              </div>
            </div>

          </div>

          {/* Battery progress bar */}
          <div>
            <div className="flex justify-between mb-1.5">
              <p className="text-xs text-gray-400">Battery level</p>
              <p className="text-xs font-medium text-gray-600">{battery.toFixed(1)}%</p>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2.5">
              <div
                className="bg-emerald-500 h-2.5 rounded-full transition-all duration-1000"
                style={{ width: `${battery}%` }}
              />
            </div>
          </div>

          {/* Station info */}
          <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-4 py-3">
            <MapPin size={14} className="text-gray-400" />
            <p className="text-xs text-gray-500">
              {session.station.name} · Slot #{session.station.slotNumber}
            </p>
          </div>

          {/* Cost breakdown */}
          <div className="border border-gray-100 rounded-xl p-4 space-y-2">
            <div className="flex justify-between">
              <p className="text-xs text-gray-400">Rate</p>
              <p className="text-xs text-gray-700">₹{RATE} / kWh</p>
            </div>
            <div className="flex justify-between">
              <p className="text-xs text-gray-400">Energy cost so far</p>
              <p className="text-xs text-gray-700">₹{energyCost.toFixed(2)}</p>
            </div>
            <div className="flex justify-between">
              <p className="text-xs text-gray-400">Platform fee</p>
              <p className="text-xs text-gray-700">₹{PLATFORM_FEE}.00</p>
            </div>
            <div className="border-t border-gray-100 pt-2 flex justify-between">
              <p className="text-xs font-medium text-gray-600">Total so far</p>
              <p className="text-xs font-semibold text-emerald-600">₹{totalCost.toFixed(2)}</p>
            </div>
          </div>

          {/* Stop button */}
          {!showStopConfirm ? (
            <button
              onClick={() => setShowStopConfirm(true)}
              className="w-full border border-red-200 text-red-600 hover:bg-red-50 font-medium py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <Square size={16} />
              Stop charging
            </button>
          ) : (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-3">
              <p className="text-sm font-medium text-red-700 text-center">
                Stop charging now?
              </p>
              <p className="text-xs text-red-500 text-center">
                You will be billed ₹{totalCost.toFixed(2)} for {kWhUsed.toFixed(3)} kWh
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowStopConfirm(false)}
                  className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm font-medium"
                >
                  Continue
                </button>
                <button
                  onClick={handleStop}
                  className="flex-1 bg-red-600 text-white py-2.5 rounded-xl text-sm font-medium"
                >
                  Yes, stop
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}