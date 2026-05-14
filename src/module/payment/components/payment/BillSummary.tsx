import { useState } from 'react'
import { Zap, Clock, MapPin, Tag, AlertCircle, ChevronRight } from 'lucide-react'
import type { SessionData } from './PreAuth'

interface BillSummaryProps {
  session: SessionData
  kWhUsed: number
  totalAmount: number
  onProceed: (finalAmount: number) => void
  onDispute: () => void
}

export default function BillSummary({
  session,
  kWhUsed,
  onProceed,
  onDispute,
}: BillSummaryProps) {
  const [rewardsApplied, setRewardsApplied] = useState(true)

  const RATE = session.charger.ratePerUnit       // ₹8
  const PLATFORM_FEE = session.charger.platformFee // ₹8
  const IDLE_FEE = 0                              // no idle in this session
  const REWARDS_DISCOUNT = rewardsApplied ? 5 : 0 // ₹5 rewards

  const energyCost = parseFloat((kWhUsed * RATE).toFixed(2))
  const subtotal = energyCost + PLATFORM_FEE + IDLE_FEE
  const finalAmount = parseFloat((subtotal - REWARDS_DISCOUNT).toFixed(2))

  // Session duration mock — in real app comes from startTime/endTime
  const duration = Math.ceil((kWhUsed / (50 / 60)))  // mins based on 50kW
  const now = new Date()
  const timeString = now.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-100">

        {/* Header */}
        <div className="bg-emerald-600 rounded-t-2xl px-5 py-4">
          <p className="text-emerald-100 text-xs">CHARGE-GRID</p>
          <h1 className="text-white font-medium text-lg">Bill Summary</h1>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 pt-4">
          <div className="w-2 h-1.5 bg-emerald-200 rounded-full" />
          <div className="w-2 h-1.5 bg-emerald-200 rounded-full" />
          <div className="w-6 h-1.5 bg-emerald-600 rounded-full" />
          <div className="w-2 h-1.5 bg-gray-200 rounded-full" />
          <div className="w-2 h-1.5 bg-gray-200 rounded-full" />
        </div>

        <div className="p-5 space-y-4">

          {/* Session summary cards */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-blue-50 rounded-xl p-3 text-center">
              <div className="flex justify-center mb-1">
                <Zap size={14} className="text-blue-600" />
              </div>
              <p className="text-sm font-semibold text-blue-800">{kWhUsed} kWh</p>
              <p className="text-xs text-blue-400">energy used</p>
            </div>
            <div className="bg-purple-50 rounded-xl p-3 text-center">
              <div className="flex justify-center mb-1">
                <Clock size={14} className="text-purple-600" />
              </div>
              <p className="text-sm font-semibold text-purple-800">{duration} min</p>
              <p className="text-xs text-purple-400">duration</p>
            </div>
            <div className="bg-amber-50 rounded-xl p-3 text-center">
              <div className="flex justify-center mb-1">
                <MapPin size={14} className="text-amber-600" />
              </div>
              <p className="text-sm font-semibold text-amber-800">
                Slot #{session.station.slotNumber}
              </p>
              <p className="text-xs text-amber-400">station</p>
            </div>
          </div>

          {/* Station name */}
          <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-4 py-3">
            <MapPin size={14} className="text-gray-400" />
            <p className="text-xs text-gray-500">{session.station.name}</p>
            <span className="ml-auto text-xs text-gray-400">{timeString}</span>
          </div>

          {/* Bill breakdown */}
          <div className="border border-gray-100 rounded-xl overflow-hidden">

            <div className="bg-gray-50 px-4 py-2.5">
              <p className="text-xs font-medium text-gray-500">Bill breakdown</p>
            </div>

            <div className="divide-y divide-gray-50">

              <div className="flex justify-between items-center px-4 py-3">
                <div>
                  <p className="text-sm text-gray-700">Energy cost</p>
                  <p className="text-xs text-gray-400">{kWhUsed} kWh × ₹{RATE}</p>
                </div>
                <p className="text-sm font-medium text-gray-800">₹{energyCost}</p>
              </div>

              <div className="flex justify-between items-center px-4 py-3">
                <div>
                  <p className="text-sm text-gray-700">Platform fee</p>
                  <p className="text-xs text-gray-400">flat per session</p>
                </div>
                <p className="text-sm font-medium text-gray-800">₹{PLATFORM_FEE}.00</p>
              </div>

              <div className="flex justify-between items-center px-4 py-3">
                <div>
                  <p className="text-sm text-gray-700">Idle fee</p>
                  <p className="text-xs text-gray-400">no idle time detected</p>
                </div>
                <p className="text-sm font-medium text-gray-400">₹0.00</p>
              </div>

              {/* Rewards toggle */}
              <div className="flex justify-between items-center px-4 py-3 bg-green-50">
                <div className="flex items-center gap-2">
                  <Tag size={14} className="text-green-600" />
                  <div>
                    <p className="text-sm text-green-700">Rewards discount</p>
                    <p className="text-xs text-green-500">10 pts redeemed</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-green-600">
                    − ₹{REWARDS_DISCOUNT}.00
                  </p>
                  <button
                    onClick={() => setRewardsApplied(!rewardsApplied)}
                    className={`w-9 h-5 rounded-full transition-colors ${
                      rewardsApplied ? 'bg-green-500' : 'bg-gray-300'
                    }`}
                  >
                    <div className={`w-4 h-4 bg-white rounded-full mx-auto transition-transform ${
                      rewardsApplied ? 'translate-x-2' : '-translate-x-2'
                    }`} />
                  </button>
                </div>
              </div>

            </div>

            {/* Total */}
            <div className="bg-emerald-50 px-4 py-4 flex justify-between items-center">
              <div>
                <p className="text-sm font-semibold text-emerald-800">Total payable</p>
                <p className="text-xs text-emerald-600">
                  Formula: ({kWhUsed} × ₹{RATE}) + ₹{PLATFORM_FEE} − ₹{REWARDS_DISCOUNT}
                </p>
              </div>
              <p className="text-2xl font-bold text-emerald-700">₹{finalAmount}</p>
            </div>

          </div>

          {/* Pre-auth note */}
          <div className="flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
            <AlertCircle size={14} className="text-amber-500 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-amber-600">
              Your ₹200 pre-auth hold will be released. Only ₹{finalAmount} will be debited.
            </p>
          </div>

          {/* Buttons */}
          <button
            onClick={() => onProceed(finalAmount)}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            Proceed to pay ₹{finalAmount}
            <ChevronRight size={18} />
          </button>

          <button
            onClick={onDispute}
            className="w-full border border-gray-200 text-gray-500 hover:bg-gray-50 font-medium py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            <AlertCircle size={15} />
            Dispute amount
          </button>

        </div>
      </div>
    </div>
  )
}