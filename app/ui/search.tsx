'use client';

import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useDebouncedCallback } from 'use-debounce';

export default function Search({ placeholder }: { placeholder: string }) {
  const searchParam = useSearchParams();
  const pathname = usePathname(); // 현재 url path
  const { replace } = useRouter();

  /**
   * 검색 핸들러
   * @param term 검색어
   */
  const handleSearch = useDebouncedCallback((term: string) => {
    // useDebouncedCallback : 사용자가 입력을 멈추고 300ms 후 실행
    console.log('Searching: ', term);

    const param = new URLSearchParams(searchParam);

    // 검색어 변경되면 새로운 파라미터로 query string 만듬
    if (term) {
      param.set('query', term);
    } else {
      param.delete('query');
    }

    // 경로 업데이트, reload 없이 url 업데이트!
    replace(`${pathname}?${param.toString()}`);
  }, 300);

  return (
    <div className="relative flex flex-1 flex-shrink-0">
      <label htmlFor="search" className="sr-only">
        Search
      </label>
      <input
        className="peer block w-full rounded-md border border-gray-200 py-[9px] pl-10 text-sm outline-2 placeholder:text-gray-500"
        placeholder={placeholder}
        defaultValue={searchParam.get('query')?.toString()}
        onChange={(e) => {
          handleSearch(e.target.value);
        }}
      />
      <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500 peer-focus:text-gray-900" />
    </div>
  );
}
