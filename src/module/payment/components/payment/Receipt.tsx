import { useState } from 'react'
import { CheckCircle, Download, Home, MapPin, Zap, Clock, Star, Copy, Check } from 'lucide-react'
import type { SessionData } from './PreAuth'

interface ReceiptProps {
  session: SessionData
  finalAmount: number
  kWhUsed: number
  txnId: string
  paymentMethod: string
  onHome: () => void
}

export default function Receipt({
  session,
  finalAmount,
  kWhUsed,
  txnId,
  paymentMethod,
  onHome,
}: ReceiptProps) {
  const [copied, setCopied] = useState(false)

  const RATE = session.charger.ratePerUnit
  const PLATFORM_FEE = session.charger.platformFee
  const REWARDS_DISCOUNT = 5
  const REWARDS_EARNED = 10
  const energyCost = parseFloat((kWhUsed * RATE).toFixed(2))
  const duration = Math.ceil((kWhUsed / (50 / 60)))

  const now = new Date()
  const dateString = now.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
  const timeString = now.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  })

  const methodLabel =
    paymentMethod === 'upi'
      ? 'UPI'
      : paymentMethod === 'qr'
      ? 'QR Code'
      : 'CHARGE-GRID Wallet'

  const handleCopy = () => {
    navigator.clipboard.writeText(txnId)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
    const content = `
CHARGE-GRID — Payment Receipt
==============================
Transaction ID : ${txnId}
Date & Time    : ${dateString} ${timeString}
Payment Method : ${methodLabel}

Station        : ${session.station.name}
Slot           : #${session.station.slotNumber}
Vehicle        : ${session.vehicle.name} (${session.vehicle.registrationNumber})

Session Details
---------------
Energy used    : ${kWhUsed} kWh
Duration       : ${duration} min
Rate           : ₹${RATE}/kWh

Bill Breakdown
--------------
Energy cost    : ₹${energyCost}
Platform fee   : ₹${PLATFORM_FEE}.00
Idle fee       : ₹0.00
Rewards disc.  : -₹${REWARDS_DISCOUNT}.00
==============================
Total paid     : ₹${finalAmount}
==============================

Rewards earned : +${REWARDS_EARNED} pts
Thank you for charging with CHARGE-GRID!
    `.trim()

    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `receipt-${txnId}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-100">

        {/* Header */}
        <div className="bg-emerald-600 rounded-t-2xl px-5 py-4">
          <p className="text-emerald-100 text-xs">CHARGE-GRID</p>
          <h1 className="text-white font-medium text-lg">Receipt</h1>
        </div>

        {/* Step indicator — all done */}
        <div className="flex items-center justify-center gap-2 pt-4">
          <div className="w-2 h-1.5 bg-emerald-400 rounded-full" />
          <div className="w-2 h-1.5 bg-emerald-400 rounded-full" />
          <div className="w-2 h-1.5 bg-emerald-400 rounded-full" />
          <div className="w-2 h-1.5 bg-emerald-400 rounded-full" />
          <div className="w-6 h-1.5 bg-emerald-600 rounded-full" />
        </div>

        <div className="p-5 space-y-4">

          {/* Success hero */}
          <div className="flex flex-col items-center py-4 gap-3">
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center">
              <CheckCircle size={44} className="text-emerald-600" />
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-800">₹{finalAmount} paid!</p>
              <p className="text-sm text-gray-400 mt-1">
                via {methodLabel} · {dateString} {timeString}
              </p>
            </div>

            {/* Txn ID with copy */}
            <div
              onClick={handleCopy}
              className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 cursor-pointer hover:bg-gray-100 transition-colors"
            >
              <p className="text-xs text-gray-500">Txn ID:</p>
              <p className="text-xs font-mono font-medium text-gray-700">{txnId}</p>
              {copied ? (
                <Check size={13} className="text-emerald-500" />
              ) : (
                <Copy size={13} className="text-gray-400" />
              )}
            </div>
          </div>

          {/* Session summary */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-blue-50 rounded-xl p-3 text-center">
              <Zap size={14} className="text-blue-500 mx-auto mb-1" />
              <p className="text-sm font-semibold text-blue-800">{kWhUsed} kWh</p>
              <p className="text-xs text-blue-400">energy</p>
            </div>
            <div className="bg-purple-50 rounded-xl p-3 text-center">
              <Clock size={14} className="text-purple-500 mx-auto mb-1" />
              <p className="text-sm font-semibold text-purple-800">{duration} min</p>
              <p className="text-xs text-purple-400">duration</p>
            </div>
            <div className="bg-amber-50 rounded-xl p-3 text-center">
              <Star size={14} className="text-amber-500 mx-auto mb-1" />
              <p className="text-sm font-semibold text-amber-800">+{REWARDS_EARNED} pts</p>
              <p className="text-xs text-amber-400">earned</p>
            </div>
          </div>

          {/* Full bill receipt */}
          <div className="border border-gray-100 rounded-xl overflow-hidden">
            <div className="bg-gray-50 px-4 py-2.5">
              <p className="text-xs font-medium text-gray-500">Bill details</p>
            </div>
            <div className="divide-y divide-gray-50 px-4">
              <div className="flex justify-between py-2.5">
                <p className="text-xs text-gray-500">Energy cost</p>
                <p className="text-xs text-gray-700">₹{energyCost}</p>
              </div>
              <div className="flex justify-between py-2.5">
                <p className="text-xs text-gray-500">Platform fee</p>
                <p className="text-xs text-gray-700">₹{PLATFORM_FEE}.00</p>
              </div>
              <div className="flex justify-between py-2.5">
                <p className="text-xs text-gray-500">Idle fee</p>
                <p className="text-xs text-gray-400">₹0.00</p>
              </div>
              <div className="flex justify-between py-2.5">
                <p className="text-xs text-gray-500">Rewards discount</p>
                <p className="text-xs text-emerald-600">− ₹{REWARDS_DISCOUNT}.00</p>
              </div>
              <div className="flex justify-between py-3">
                <p className="text-sm font-semibold text-gray-700">Total paid</p>
                <p className="text-sm font-bold text-emerald-600">₹{finalAmount}</p>
              </div>
            </div>
          </div>

          {/* Station info */}
          <div className="bg-gray-50 rounded-xl px-4 py-3 space-y-2">
            <div className="flex items-center gap-2">
              <MapPin size={13} className="text-gray-400" />
              <p className="text-xs text-gray-600">{session.station.name}</p>
              <span className="ml-auto text-xs text-gray-400">
                Slot #{session.station.slotNumber}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Zap size={13} className="text-gray-400" />
              <p className="text-xs text-gray-600">
                {session.vehicle.name} · {session.vehicle.registrationNumber}
              </p>
            </div>
          </div>

          {/* Pre-auth released note */}
          <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3">
            <p className="text-xs text-emerald-700 text-center">
              ✓ ₹200 pre-auth hold has been released to your account
            </p>
          </div>

          {/* Rewards banner */}
          <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 flex items-center gap-3">
            <div className="bg-amber-100 p-2 rounded-lg">
              <Star size={16} className="text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-amber-800">
                +{REWARDS_EARNED} points earned!
              </p>
              <p className="text-xs text-amber-500">
                Redeem on your next charging session
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <button
            onClick={handleDownload}
            className="w-full border border-emerald-200 text-emerald-700 hover:bg-emerald-50 font-medium py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            <Download size={16} />
            Download receipt
          </button>

          <button
            onClick={onHome}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            <Home size={16} />
            Back to home
          </button>

          <p className="text-center text-xs text-gray-400 pb-1">
            Thank you for charging with CHARGE-GRID 🌱
          </p>

        </div>
      </div>
    </div>
  )
}