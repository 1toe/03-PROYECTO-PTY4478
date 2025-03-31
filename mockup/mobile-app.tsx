"use client"

import { useState } from "react"
import {
  Bell,
  ChevronRight,
  HelpCircle,
  Phone,
  CreditCard,
  Apple,
  DollarSign,
  MessageCircle,
  Menu,
  Store,
} from "lucide-react"

export default function Component() {
  const [activeScreen, setActiveScreen] = useState<"payment" | "settings">("payment")

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto overflow-hidden bg-gray-800">
      {/* Status Bar */}
      <div className="flex items-center justify-between px-4 py-1 bg-gray-800 text-white">
        <div>15:48</div>
        <div className="flex items-center gap-1">
          <Bell className="w-4 h-4" />
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
              fill="#ff9999"
            />
          </svg>
        </div>
        <div className="flex items-center gap-1">
          <Bell className="w-4 h-4" />
          <div className="flex items-center">
            <div className="w-4 h-4 flex items-center justify-center">
              <div className="w-1 h-3 bg-white rounded-full"></div>
              <div className="w-1 h-2 bg-white rounded-full ml-0.5"></div>
              <div className="w-1 h-1 bg-white rounded-full ml-0.5"></div>
            </div>
            43%
          </div>
        </div>
      </div>

      {activeScreen === "payment" ? (
        <div className="flex-1 relative overflow-hidden bg-purple-200">
          {/* Background with food items would be images positioned absolutely */}

          {/* Logo Bar */}
          <div className="bg-white rounded-full mx-4 mt-8 mb-4 py-3 px-6 flex items-center justify-center">
            <div className="text-blue-900 font-bold text-xl mr-2">Lorem</div>
            <div className="bg-red-500 text-white rounded-full px-3 py-1">ipsum</div>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col items-center justify-center px-4">
            <div className="text-xl font-medium text-center mb-6">Lorem ipsum dolor sit:</div>

            {/* Circle Button */}
            <div className="relative">
              <div className="w-40 h-40 rounded-full border-4 border-white flex items-center justify-center">
                <div className="w-32 h-32 rounded-full bg-purple-600 flex flex-col items-center justify-center text-white">
                  <div className="font-bold text-xl">Lorem</div>
                  <div className="font-medium">Ipsum</div>
                </div>
              </div>
            </div>

            {/* Version */}
            <div className="absolute bottom-24 left-4 text-xs text-gray-600">V.2.11.7</div>
          </div>

          {/* Bottom Navigation */}
          <div className="bg-purple-600 py-2 flex items-center justify-around">
            <button className="flex flex-col items-center text-white text-xs">
              <Store className="w-6 h-6 mb-1" />
              Lorem
            </button>
            <button className="flex flex-col items-center text-white text-xs">
              <DollarSign className="w-6 h-6 mb-1" />
              Ipsum
            </button>
            <button onClick={() => setActiveScreen("settings")} className="relative -mt-8">
              <div className="w-16 h-16 rounded-full bg-purple-600 border-4 border-black flex items-center justify-center">
                <DollarSign className="w-8 h-8 text-white" />
              </div>
              <div className="text-white text-xs text-center mt-1">Dolor</div>
            </button>
            <button className="flex flex-col items-center text-white text-xs">
              <MessageCircle className="w-6 h-6 mb-1" />
              Sit
            </button>
            <button className="flex flex-col items-center text-white text-xs">
              <Menu className="w-6 h-6 mb-1" />
              Amet
            </button>
          </div>

          {/* Bottom Navigation Bar */}
          <div className="bg-black h-10 flex items-center justify-around px-8">
            <div className="text-2xl">|||</div>
            <div className="w-6 h-6 rounded-full border-2 border-white"></div>
            <div className="text-xl">&lt;</div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col bg-gray-100">
          {/* Mobile Payment Section */}
          <div className="bg-purple-600 rounded-b-3xl px-4 py-3 flex items-center justify-between">
            <div className="flex items-center">
              <Phone className="w-6 h-6 text-white mr-3" />
              <div className="text-white text-xl font-medium">Lorem Ipsum</div>
            </div>
            <HelpCircle className="w-6 h-6 text-white" />
          </div>

          <div className="border border-gray-200 rounded-lg mx-4 my-3 divide-y divide-gray-200">
            <div className="flex items-center justify-between p-4">
              <div className="text-gray-800 text-lg">Lorem Ipsum Dolor</div>
              <ChevronRight className="w-6 h-6 text-gray-400" />
            </div>
            <div className="flex items-center justify-between p-4">
              <div className="text-gray-800 text-lg">Sit Amet Consectetur</div>
              <ChevronRight className="w-6 h-6 text-gray-400" />
            </div>
          </div>

          {/* My Card Section */}
          <div className="bg-purple-600 rounded-b-3xl px-4 py-3 flex items-center justify-between mt-2">
            <div className="flex items-center">
              <CreditCard className="w-6 h-6 text-white mr-3" />
              <div className="text-white text-xl font-medium">Lorem Ipsum Dolor</div>
            </div>
            <HelpCircle className="w-6 h-6 text-white" />
          </div>

          <div className="border border-gray-200 rounded-lg mx-4 my-3 divide-y divide-gray-200">
            <div className="flex items-center justify-between p-4">
              <div className="text-gray-800 text-lg">Adipiscing Elit</div>
              <ChevronRight className="w-6 h-6 text-gray-400" />
            </div>
            <div className="flex items-center justify-between p-4">
              <div className="text-gray-800 text-lg">Sed Do Eiusmod</div>
              <ChevronRight className="w-6 h-6 text-gray-400" />
            </div>
            <div className="flex items-center justify-between p-4">
              <div className="text-gray-800 text-lg">Tempor Incididunt</div>
              <ChevronRight className="w-6 h-6 text-gray-400" />
            </div>
            <div className="flex items-center justify-between p-4">
              <div className="text-gray-800 text-lg">Ut Labore Et Dolore</div>
              <ChevronRight className="w-6 h-6 text-gray-400" />
            </div>
          </div>

          {/* Health Section */}
          <div className="bg-purple-600 rounded-b-3xl px-4 py-3 flex items-center justify-between mt-2">
            <div className="flex items-center">
              <Apple className="w-6 h-6 text-white mr-3" />
              <div className="text-white text-xl font-medium">Lorem Ipsum</div>
            </div>
            <HelpCircle className="w-6 h-6 text-white" />
          </div>

          <div className="border border-gray-200 rounded-lg mx-4 my-3 divide-y divide-gray-200">
            <div className="flex items-center justify-between p-4">
              <div className="text-gray-800 text-lg">Magna Aliqua</div>
              <ChevronRight className="w-6 h-6 text-gray-400" />
            </div>
            <div className="flex items-center justify-between p-4">
              <div className="text-gray-800 text-lg">Ut Enim Ad Minim</div>
              <ChevronRight className="w-6 h-6 text-gray-400" />
            </div>
            <div className="flex items-center justify-between p-4">
              <div className="text-gray-800 text-lg">Veniam Quis</div>
              <ChevronRight className="w-6 h-6 text-gray-400" />
            </div>
          </div>

          {/* Bottom Navigation */}
          <div className="mt-auto bg-purple-600 py-2 flex items-center justify-around">
            <button className="flex flex-col items-center text-white text-xs">
              <Store className="w-6 h-6 mb-1" />
              Lorem
            </button>
            <button className="flex flex-col items-center text-white text-xs">
              <DollarSign className="w-6 h-6 mb-1" />
              Ipsum
            </button>
            <button onClick={() => setActiveScreen("payment")} className="relative -mt-8">
              <div className="w-16 h-16 rounded-full bg-purple-600 border-4 border-black flex items-center justify-center">
                <DollarSign className="w-8 h-8 text-white" />
              </div>
              <div className="text-white text-xs text-center mt-1">Dolor</div>
            </button>
            <button className="flex flex-col items-center text-white text-xs">
              <MessageCircle className="w-6 h-6 mb-1" />
              Sit
            </button>
            <button className="flex flex-col items-center text-white text-xs">
              <Menu className="w-6 h-6 mb-1" />
              Amet
            </button>
          </div>

          {/* Bottom Navigation Bar */}
          <div className="bg-black h-10 flex items-center justify-around px-8">
            <div className="text-2xl text-white">|||</div>
            <div className="w-6 h-6 rounded-full border-2 border-white"></div>
            <div className="text-xl text-white">&lt;</div>
          </div>
        </div>
      )}
    </div>
  )
}

