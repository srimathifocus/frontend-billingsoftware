import { useState, useEffect } from "react";
import { useAutoLogout } from "../hooks/useAutoLogout";

export const AutoLogoutDemo = () => {
  const [lastActivity, setLastActivity] = useState<Date>(new Date());
  const { resetTimer } = useAutoLogout();

  useEffect(() => {
    const updateActivity = () => {
      setLastActivity(new Date());
    };

    const events = [
      "mousedown",
      "mousemove",
      "keypress",
      "scroll",
      "touchstart",
      "click",
      "keydown",
    ];

    events.forEach((event) => {
      document.addEventListener(event, updateActivity, true);
    });

    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, updateActivity, true);
      });
    };
  }, []);

  const handleManualReset = () => {
    resetTimer();
    setLastActivity(new Date());
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">
        Auto-Logout Demo
      </h2>

      <div className="space-y-4">
        <div className="p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold text-blue-800 mb-2">How it works:</h3>
          <ul className="text-blue-700 space-y-1 text-sm">
            <li>• After 5 minutes of inactivity, you'll see a warning</li>
            <li>• The warning shows a 20-second countdown</li>
            <li>
              • Any mouse movement, click, or keyboard activity resets the timer
            </li>
            <li>
              • If no activity during the warning, you'll be logged out
              automatically
            </li>
          </ul>
        </div>

        <div className="p-4 bg-green-50 rounded-lg">
          <h3 className="font-semibold text-green-800 mb-2">Current Status:</h3>
          <p className="text-green-700 text-sm">
            Last activity: {lastActivity.toLocaleTimeString()}
          </p>
        </div>

        <div className="flex gap-4">
          <button
            onClick={handleManualReset}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Reset Timer Manually
          </button>

          <div className="px-4 py-2 bg-gray-100 rounded-lg text-gray-600 text-sm flex items-center">
            Timer resets automatically on any user interaction
          </div>
        </div>

        <div className="p-4 bg-yellow-50 rounded-lg">
          <h3 className="font-semibold text-yellow-800 mb-2">
            Test Instructions:
          </h3>
          <ol className="text-yellow-700 space-y-1 text-sm">
            <li>1. Stop moving your mouse and don't click anything</li>
            <li>2. Wait for 4 minutes and 40 seconds</li>
            <li>3. You should see a warning toast appear</li>
            <li>4. Move your mouse to cancel the logout</li>
            <li>5. Or wait 20 seconds to see the automatic logout</li>
          </ol>
        </div>
      </div>
    </div>
  );
};
