import { useCallback, useEffect, useState } from 'react';
import { refreshLearningProgress } from '../components/LearningProgress';
import { isWordBookmarked, toggleWordBookmark } from '../database/hanjaDB';
import { useAppStore } from '../stores/useAppStore';

export const useWordBookmark = (wordId: string) => {
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isBookmarkLoading, setIsBookmarkLoading] = useState(false);
  const bookmarkedIdiomIds = useAppStore(state => state.bookmarkedIdiomIds);
  const toggleIdiomBookmark = useAppStore(state => state.toggleIdiomBookmark);
  const isIdiom = wordId.startsWith('idiom_');

  useEffect(() => {
    if (!isIdiom) {
      return;
    }
    setIsBookmarked(bookmarkedIdiomIds.includes(wordId));
  }, [isIdiom, bookmarkedIdiomIds, wordId]);

  useEffect(() => {
    if (isIdiom) return;

    let isMounted = true;

    const loadStatus = async () => {
      try {
        const bookmarked = await isWordBookmarked(wordId);
        if (isMounted) {
          setIsBookmarked(bookmarked);
        }
      } catch (error) {
        console.error('북마크 상태 로드 실패:', error);
      }
    };

    loadStatus();

    return () => {
      isMounted = false;
    };
  }, [isIdiom, wordId]);

  const toggleBookmark = useCallback(async () => {
    if (isBookmarkLoading) return;

    if (isIdiom) {
      toggleIdiomBookmark(wordId);
      setIsBookmarked(prev => !prev);
      refreshLearningProgress();
      return;
    }

    setIsBookmarkLoading(true);
    try {
      const newBookmarkState = await toggleWordBookmark(wordId);
      setIsBookmarked(newBookmarkState);
      refreshLearningProgress();
    } catch (error) {
      console.error('북마크 토글 실패:', error);
    } finally {
      setIsBookmarkLoading(false);
    }
  }, [isBookmarkLoading, isIdiom, toggleIdiomBookmark, wordId]);

  return {
    isBookmarked,
    isBookmarkLoading,
    toggleBookmark,
  };
};
