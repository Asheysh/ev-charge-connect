import { useState } from 'react'
import { MapPin, Zap, Car, Shield, ChevronRight, X } from 'lucide-react'

interface Station {
  id: string
  name: string
  location: string
  slotNumber: number
}

interface Charger {
  type: 'AC' | 'DC'
  speed: number
  ratePerUnit: number
  platformFee: number
}

interface Vehicle {
  name: string
  registrationNumber: string
}

export interface SessionData {
  station: Station
  charger: Charger
  vehicle: Vehicle
  preAuthAmount: number
  startTime?: Date
  endTime?: Date
  kWhUsed?: number
  totalAmount?: number
}

const mockSession: SessionData = {
  station: {
    id: 'STN001',
    name: 'ChargeGrid — Connaught Place',
    location: 'Block N, Connaught Place, New Delhi',
    slotNumber: 3,
  },
  charger: {
    type: 'DC',
    speed: 50,
    ratePerUnit: 8,
    platformFee: 8,
  },
  vehicle: {
    name: 'Tata Nexon EV',
    registrationNumber: 'MH 01 AB 1234',
  },
  preAuthAmount: 200,
}

interface PreAuthProps {
  onAuthorize: (session: SessionData) => void
  onCancel: () => void
}

export default function PreAuth({ onAuthorize, onCancel }: PreAuthProps) {
  const [loading, setLoading] = useState(false)
  const session = mockSession

  const handleAuthorize = () => {
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      onAuthorize(session)
    }, 1500)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-100">

        {/* Header */}
        <div className="bg-emerald-600 rounded-t-2xl px-5 py-4 flex items-center justify-between">
          <div>
            <p className="text-emerald-100 text-xs">CHARGE-GRID</p>
            <h1 className="text-white font-medium text-lg">Confirm & Authorize</h1>
          </div>
          <button onClick={onCancel} className="text-emerald-100 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 pt-4">
          <div className="w-6 h-1.5 bg-emerald-600 rounded-full" />
          <div className="w-2 h-1.5 bg-gray-200 rounded-full" />
          <div className="w-2 h-1.5 bg-gray-200 rounded-full" />
          <div className="w-2 h-1.5 bg-gray-200 rounded-full" />
          <div className="w-2 h-1.5 bg-gray-200 rounded-full" />
        </div>

        <div className="p-5 space-y-4">

          {/* Station */}
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <div className="bg-emerald-100 p-2 rounded-lg mt-0.5">
                <MapPin size={16} className="text-emerald-700" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Station</p>
                <p className="text-sm font-medium text-gray-800">{session.station.name}</p>
                <p className="text-xs text-gray-400">{session.station.location}</p>
              </div>
            </div>
          </div>

          {/* Charger */}
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-blue-100 p-2 rounded-lg">
                <Zap size={16} className="text-blue-700" />
              </div>
              <p className="text-xs text-gray-500 font-medium">Charger Details</p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center">
                <p className="text-sm font-semibold text-gray-800">{session.charger.type}</p>
                <p className="text-xs text-gray-400">Type</p>
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-gray-800">{session.charger.speed} kW</p>
                <p className="text-xs text-gray-400">Speed</p>
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-gray-800">₹{session.charger.ratePerUnit}/kWh</p>
                <p className="text-xs text-gray-400">Rate</p>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-gray-200 flex justify-between">
              <p className="text-xs text-gray-500">Platform fee</p>
              <p className="text-xs text-gray-700">₹{session.charger.platformFee} flat per session</p>
            </div>
          </div>

          {/* Vehicle */}
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="bg-purple-100 p-2 rounded-lg">
                <Car size={16} className="text-purple-700" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Your Vehicle</p>
                <p className="text-sm font-medium text-gray-800">{session.vehicle.name}</p>
                <p className="text-xs text-gray-400">{session.vehicle.registrationNumber}</p>
              </div>
            </div>
          </div>

          {/* Pre-auth hold */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <div className="bg-amber-100 p-2 rounded-lg mt-0.5">
                <Shield size={16} className="text-amber-700" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-amber-800">Pre-auth hold</p>
                  <p className="text-lg font-bold text-amber-800">₹{session.preAuthAmount}</p>
                </div>
                <p className="text-xs text-amber-600 mt-1">
                  Temporarily blocked — not debited. Only the exact bill amount is charged after your session ends.
                </p>
              </div>
            </div>
          </div>

          {/* Slot */}
          <div className="flex items-center justify-between px-1">
            <p className="text-xs text-gray-400">Slot assigned</p>
            <p className="text-xs font-medium text-gray-700">Slot #{session.station.slotNumber}</p>
          </div>

          {/* Buttons */}
          <button
            onClick={handleAuthorize}
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-medium py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Authorizing...
              </>
            ) : (
              <>
                Authorize ₹{session.preAuthAmount} hold
                <ChevronRight size={18} />
              </>
            )}
          </button>

          <button
            onClick={onCancel}
            className="w-full border border-gray-200 text-gray-600 hover:bg-gray-50 font-medium py-3 rounded-xl transition-colors"
          >
            Cancel
          </button>

          <p className="text-center text-xs text-gray-400">Secured · UPI Pre-auth · Encrypted</p>

        </div>
      </div>
    </div>
  )
}