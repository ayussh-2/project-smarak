import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useApi } from '@/hooks/use-api';
import { useRouter } from 'next/navigation';

export function usePayment() {
  const { isLoading, makeRequest } = useApi();
  const [user, setUser] = useState({});
  const [paymentAmount, setPaymentAmount] = useState<number>(599);
  const regularPrice = 749;
  const [screenshotUrl, setScreenshotUrl] = useState('');
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const router = useRouter();

  const initiatePayment = async () => {
    try {
      if (!user) {
        toast.error('User not found');
        return;
      }

      if (!screenshotUrl) {
        toast.error('Please upload payment screenshot');
        return;
      }

      const response = await makeRequest('POST', '/payment', {
        amount: paymentAmount,
        paymentScreenshot: screenshotUrl,
      });
      if (response.status === 'error') return;

      // Check payment status immediately after submission
      await checkPaymentStatus();
    } catch (error) {
      toast.error('Payment initiation failed');
      console.error(error);
    }
  };

  const getMe = async () => {
    try {
      const response = await makeRequest('GET', '/user/me');
      if (response.status === 'error') {
        toast.error('Failed to fetch user details');
        return null;
      }
      return response.data.data.user;
    } catch (error) {
      console.error('Error fetching user:', error);
      toast.error('Failed to fetch user details');
      return null;
    }
  };

  const getPaymentAmount = async () => {
    try {
      const response = await makeRequest('GET', '/payment/amount');
      if (response.status === 'error') {
        toast.error('Failed to fetch payment amount');
        return null;
      }
      return response.data.data.paymentAmount;
    } catch (error) {
      console.error('Error fetching payment amount:', error);
      toast.error('Failed to fetch payment amount');
      return null;
    }
  };

  const checkPaymentStatus = async () => {
    try {
      const response = await makeRequest('GET', '/payment/status');
      if (response.status === 'error') {
        toast.error('Failed to fetch payment status');
        return false;
      }

      if (response.data.data.hasPaid) {
        toast.success('Payment initiated. Redirecting to profile...');
        router.push('/profile');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error checking payment status:', error);
      toast.error('Failed to check payment status');
      return false;
    }
  };

  useEffect(() => {
    const loadInitialData = async () => {
      setIsInitialLoading(true);
      try {
        const isPaid = await checkPaymentStatus();
        if (isPaid) return;

        const [userData, amountData] = await Promise.all([getMe(), getPaymentAmount()]);

        if (userData) setUser(userData);
        if (amountData) setPaymentAmount(amountData);
      } catch (error) {
        console.error('Error loading initial data:', error);
      } finally {
        setIsInitialLoading(false);
      }
    };

    loadInitialData();
  }, []);

  return {
    isLoading,
    isInitialLoading,
    user,
    paymentAmount,
    regularPrice,
    screenshotUrl,
    setScreenshotUrl,
    initiatePayment,
  };
}
