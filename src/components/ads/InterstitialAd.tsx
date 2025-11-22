import Constants from 'expo-constants';
import { useEffect, useState } from 'react';

// Expo Go 환경에서는 광고 기능 비활성화
const isExpoGo = Constants.appOwnership === 'expo';

const adsModule = (() => {
  if (isExpoGo) {
    return null;
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require('react-native-google-mobile-ads');
  } catch (error) {
    console.warn('📱 AdMob 모듈을 로드할 수 없습니다:', error);
    return null;
  }
})();

const AdEventType = adsModule?.AdEventType;
const InterstitialAdModule = adsModule?.InterstitialAd;

// AdMob 전면 광고 단위 ID
const AD_UNIT_ID = __DEV__
  ? 'ca-app-pub-3940256099942544/4411468910' // Google 데모 전면 광고 단위
  : 'ca-app-pub-3195009493032065/8736338432'; // 실제 광고 단위

interface InterstitialAdManager {
  isLoaded: boolean;
  loadAd: () => void;
  showAd: () => Promise<boolean>;
}

class InterstitialAdService {
  private ad: any = null;
  private isLoaded = false;
  private isLoading = false;

  constructor() {
    if (!isExpoGo) {
      this.createAd();
    } else {
      console.log('📱 Expo Go 환경: 광고 기능 비활성화');
    }
  }

  private createAd() {
    if (isExpoGo || !InterstitialAdModule || !AdEventType) {
      return;
    }

    try {
      this.ad = InterstitialAdModule.createForAdRequest(AD_UNIT_ID, {
        requestNonPersonalizedAdsOnly: true,
      });

      // 광고 로드 완료 이벤트
      this.ad.addAdEventListener(AdEventType.LOADED, () => {
        console.log('📱 전면 광고 로드 완료 ✅');
        console.log('📱 광고 단위 ID:', AD_UNIT_ID);
        console.log('📱 현재 환경:', __DEV__ ? '개발' : '프로덕션');
        this.isLoaded = true;
        this.isLoading = false;
      });

      // 광고 로드 실패 이벤트
      this.ad.addAdEventListener(AdEventType.ERROR, error => {
        console.error('📱 전면 광고 로드 실패 ❌');
        console.error('📱 에러 상세:', error);
        console.error('📱 광고 단위 ID:', AD_UNIT_ID);
        console.error('📱 현재 환경:', __DEV__ ? '개발' : '프로덕션');
        this.isLoaded = false;
        this.isLoading = false;
      });

      // 광고 표시 완료 이벤트
      this.ad.addAdEventListener(AdEventType.OPENED, () => {
        console.log('📱 전면 광고 표시됨');
      });

      // 광고 닫힘 이벤트
      this.ad.addAdEventListener(AdEventType.CLOSED, () => {
        console.log('📱 전면 광고 닫힘');
        this.isLoaded = false;
        // 광고 닫힌 후 새로운 광고 로드
        this.loadAd();
      });
    } catch (error) {
      console.warn('📱 광고 생성 중 에러:', error);
    }
  }

  public loadAd(): void {
    if (isExpoGo) {
      console.log('📱 Expo Go 환경: 광고 로드 시뮬레이션');
      this.isLoaded = true;
      return;
    }

    if (this.isLoading || this.isLoaded || !this.ad) {
      return;
    }

    console.log('📱 전면 광고 로드 시작...');
    this.isLoading = true;
    this.ad.load();
  }

  public async showAd(): Promise<boolean> {
    console.log(
      '📱 광고 표시 요청 - 환경:',
      isExpoGo ? 'Expo Go' : 'Native Build'
    );

    if (isExpoGo) {
      console.log('📱 Expo Go 환경: 네이티브 광고 모듈 사용 불가');
      console.log('📱 Expo Go 환경: 광고 시뮬레이션 (1초 대기)');
      return new Promise(resolve => {
        setTimeout(() => {
          console.log('📱 광고 시뮬레이션 완료');
          this.isLoaded = false;
          resolve(true);
        }, 1000);
      });
    } else {
      console.log('📱 광고 로드 상태:', this.isLoaded);
      console.log('📱 광고 인스턴스 존재:', !!this.ad);
      console.log('📱 광고 단위 ID:', AD_UNIT_ID);
    }

    if (!this.isLoaded || !this.ad) {
      console.log(
        '📱 전면 광고가 로드되지 않음 - 로드 상태:',
        this.isLoaded,
        '광고 인스턴스:',
        !!this.ad
      );
      console.log('📱 광고 다시 로드 시도...');
      this.loadAd();
      return false;
    }

    try {
      console.log('📱 전면 광고 표시 시작...');
      await this.ad.show();
      console.log('📱 전면 광고 표시 성공');
      return true;
    } catch (error) {
      console.error('📱 전면 광고 표시 실패:', error);
      return false;
    }
  }

  public getLoaded(): boolean {
    return this.isLoaded;
  }
}

// 싱글톤 인스턴스
const interstitialAdService = new InterstitialAdService();

// React Hook으로 전면 광고 관리
export const useInterstitialAd = (): InterstitialAdManager => {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // 컴포넌트 마운트 시 광고 로드
    interstitialAdService.loadAd();

    // 주기적으로 로드 상태 확인
    const checkLoaded = () => {
      setIsLoaded(interstitialAdService.getLoaded());
    };

    const interval = setInterval(checkLoaded, 1000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  const loadAd = () => {
    interstitialAdService.loadAd();
  };

  const showAd = async (): Promise<boolean> => {
    const success = await interstitialAdService.showAd();
    if (success) {
      setIsLoaded(false);
    }
    return success;
  };

  return {
    isLoaded,
    loadAd,
    showAd,
  };
};

// 직접 사용할 수 있는 헬퍼 함수들
export const loadInterstitialAd = () => {
  interstitialAdService.loadAd();
};

export const showInterstitialAd = async (): Promise<boolean> => {
  return await interstitialAdService.showAd();
};

export default InterstitialAdService;
