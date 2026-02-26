const API_KEY = '3bdecae3f8msh41a804efcdcd22ep13d3a7jsn81c97b463825';
const HOST = 'sportapi7.p.rapidapi.com';
const VASCO_ID = 1974; // Confirme se este é o ID que você ajustou e funcionou

export const getNextMatch = async () => {
  try {
    // Aumentamos para buscar mais eventos futuros (next/5) para garantir que o jogo de amanhã venha no JSON
    const response = await fetch(
      `https://${HOST}/api/v1/team/${VASCO_ID}/events/next/0`, 
      {
        method: 'GET',
        headers: {
          'x-rapidapi-key': API_KEY,
          'x-rapidapi-host': HOST
        }
      }
    );

    const json = await response.json();
    
    if (json.events && json.events.length > 0) {
      // Procuramos o jogo onde o Vasco participa (ID que você ajustou)
      const vascoMatch = json.events.find((event: any) => 
        event.homeTeam.id === VASCO_ID || event.awayTeam.id === VASCO_ID
      );

      if (!vascoMatch) return null;
      
      return {
        id: vascoMatch.id,
        // Tenta pegar o nome oficial do campeonato, se não tiver, usa o nome simples
        tournament: vascoMatch.tournament?.uniqueTournament?.name || vascoMatch.tournament?.name || "Campeonato",
        
        // DINÂMICO: Se o jogo for no Maracanã, a API manda Maracanã. Se for na Vila, manda Vila.
        venue: vascoMatch.venue?.name || "Estádio a definir", 
        
        timestamp: vascoMatch.startTimestamp,
        homeTeam: {
            name: vascoMatch.homeTeam.shortName?.toUpperCase() || vascoMatch.homeTeam.name,
            logo: `https://api.sofascore.app/api/v1/team/${vascoMatch.homeTeam.id}/image`
        },
        awayTeam: {
            name: vascoMatch.awayTeam.shortName?.toUpperCase() || vascoMatch.awayTeam.name,
            logo: `https://api.sofascore.app/api/v1/team/${vascoMatch.awayTeam.id}/image`
        }
        };
    }
    return null;
  } catch (error) {
    console.error("Erro no serviço de futebol:", error);
    return null;
  }
};