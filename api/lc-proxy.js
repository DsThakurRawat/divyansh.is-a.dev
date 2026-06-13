export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { handle, endpoint } = req.query;

  if (!handle) {
    return res.status(400).json({ error: 'Missing handle' });
  }

  const fetchGraphQL = async (query, variables) => {
    const response = await fetch('https://leetcode.com/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Referer': 'https://leetcode.com',
      },
      body: JSON.stringify({ query, variables })
    });
    return response.json();
  };

  try {
    if (!endpoint || endpoint === 'profile') {
      const data = await fetchGraphQL(`
        query userPublicProfile($username: String!) {
          matchedUser(username: $username) {
            profile {
              userAvatar
              realName
              aboutMe
              countryName
              school
              reputation
              ranking
            }
          }
        }
      `, { username: handle });
      
      const profile = data.data?.matchedUser?.profile || {};
      return res.status(200).json({
        name: profile.realName,
        avatar: profile.userAvatar,
        about: profile.aboutMe,
        country: profile.countryName,
        school: profile.school,
        reputation: profile.reputation,
        ranking: profile.ranking
      });
    }

    if (endpoint === 'contest') {
      const data = await fetchGraphQL(`
        query userContestRankingInfo($username: String!) {
          userContestRanking(username: $username) {
            attendedContestsCount
            rating
            globalRanking
            totalParticipants
            topPercentage
          }
          userContestRankingHistory(username: $username) {
            attended
            rating
          }
        }
      `, { username: handle });
      
      const contest = data.data?.userContestRanking || {};
      const history = data.data?.userContestRankingHistory || [];
      return res.status(200).json({
        contestAttend: contest.attendedContestsCount,
        contestRating: contest.rating,
        contestGlobalRanking: contest.globalRanking,
        totalParticipants: contest.totalParticipants,
        contestTopPercentage: contest.topPercentage,
        contestParticipation: history.filter(h => h.attended)
      });
    }

    if (endpoint === 'solved') {
      const data = await fetchGraphQL(`
        query userProblemsSolved($username: String!) {
          matchedUser(username: $username) {
            submitStatsGlobal {
              acSubmissionNum {
                difficulty
                count
              }
            }
          }
        }
      `, { username: handle });
      
      const stats = data.data?.matchedUser?.submitStatsGlobal?.acSubmissionNum || [];
      const getCount = (diff) => stats.find(s => s.difficulty === diff)?.count || 0;
      
      return res.status(200).json({
        solvedProblem: getCount('All'),
        easySolved: getCount('Easy'),
        mediumSolved: getCount('Medium'),
        hardSolved: getCount('Hard'),
        totalSubmissionNum: stats
      });
    }

    if (endpoint === 'calendar') {
      const data = await fetchGraphQL(`
        query userProfileCalendar($username: String!) {
          matchedUser(username: $username) {
            submissionCalendar
          }
        }
      `, { username: handle });
      
      return res.status(200).json({
        submissionCalendar: data.data?.matchedUser?.submissionCalendar || "{}"
      });
    }

    return res.status(400).json({ error: 'Invalid endpoint' });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
