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
      },
      // 주소 결과는 잘 변하지 않으므로 캐시
      next: { revalidate: 86400 } 
    });

    if (!response.ok) {
      throw new Error(`Naver Geocoding API err: ${response.status}`);
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

    return { error: "해당하는 주소를 찾을 수 없습니다." };
  } catch (error) {
    console.error("Geocode API Error:", error);
    return { error: "주소 변환 중 오류가 발생했습니다." };
  }
}
