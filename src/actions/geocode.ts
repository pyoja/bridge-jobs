"use server";

export async function geocodeAddress(query: string) {
  if (!query) {
    return { error: "주소가 제공되지 않았습니다." };
  }

  const clientId = process.env.NAVER_CLIENT_ID;
  const clientSecret = process.env.NAVER_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return { error: "네이버 API 키가 설정되지 않았습니다." };
  }

  try {
    const url = `https://naveropenapi.apigw.ntruss.com/map-geocode/v2/geocode?query=${encodeURIComponent(query)}`;
    
    const response = await fetch(url, {
      headers: {
        "X-NCP-APIGW-API-KEY-ID": clientId,
        "X-NCP-APIGW-API-KEY": clientSecret,
        "Accept": "application/json; charset=UTF-8"
      },
      // 주소 결과는 잘 변하지 않으므로 캐시
      next: { revalidate: 86400 } 
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Naver Geocoding API Error] Status: ${response.status}, Response: ${errorText}`);
      try {
        const errorJson = JSON.parse(errorText);
        return { error: `네이버 API 오류: ${errorJson.errorMessage || response.statusText}` };
      } catch (e) {
        return { error: `네이버 API 연동 오류 발생 (${response.status})` };
      }
    }

    const data = await response.json();

    if (data.addresses && data.addresses.length > 0) {
      const bestMatch = data.addresses[0];
      return {
        lat: parseFloat(bestMatch.y),
        lng: parseFloat(bestMatch.x),
        roadAddress: bestMatch.roadAddress || bestMatch.jibunAddress || query,
      };
    }

    // 네이버에서 200 OK를 주었지만 결과가 없는 경우
    if (data.status === 'OK' && data.meta?.totalCount === 0) {
      console.warn(`[Naver Geocoding] 주소 검색 결과 없음: ${query}`);
    } else if (data.errorMessage) {
      console.error(`[Naver Geocoding API Error Message] ${data.errorMessage}`);
    }

    return { error: "해당하는 주소를 찾을 수 없습니다. 도로명이나 동/읍/면 단위로 다시 검색해보세요." };
  } catch (error) {
    console.error("Geocode Server Action Exception:", error);
    return { error: "주소 변환 중 서버통신 오류가 발생했습니다." };
  }
}
