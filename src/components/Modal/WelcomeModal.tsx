import { Modal } from './Modal'

interface WelcomeModalProps {
  isOpen: boolean
  onClose: () => void
}

export function WelcomeModal({ isOpen, onClose }: WelcomeModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} showCloseButton={false}>
      <div className="text-center space-y-6">
        <div className="text-4xl">📈</div>

        <div>
          <h2 className="text-2xl font-bold text-arcade-blue mb-2">
            Welcome to Chart Arcade
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Test your market intuition with anonymized stock charts
          </p>
        </div>

        <div className="text-left space-y-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
          <div className="flex gap-3">
            <span className="text-xl">🎯</span>
            <div>
              <p className="font-medium">Predict the Direction</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Will the next bar go up or down?
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <span className="text-xl">💰</span>
            <div>
              <p className="font-medium">Buy & Sell</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Buy = betting up, Sell = betting down
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <span className="text-xl">⏭️</span>
            <div>
              <p className="font-medium">Skip</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Not sure? Skip and maintain your position
              </p>
            </div>
          </div>
        </div>

        <div className="text-sm text-gray-500 dark:text-gray-400 space-y-1">
          <p><strong>Keyboard:</strong> Space=Skip, B=Buy, S=Sell</p>
          <p>1-5 keys set position size, N=New stock</p>
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 rounded-lg bg-arcade-green hover:bg-green-600 text-white font-semibold transition-colors"
        >
          Let's Play!
        </button>
      </div>
    </Modal>
  )
}

export default WelcomeModal
