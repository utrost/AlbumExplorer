# Album profile gaps

Status: generated internal enrichment report, not public app content.

This report is derived from `data/app/album-atlas.json` and drives the next content-first enrichment passes. It should help Hermes choose which album profiles need better cover art, stories, tracklists, durations, and composer/songwriter/lyricist credits.

## Summary

- Albums: 760
- Albums with at least one profile gap: 502
- Missing cover art: 128
- Missing tracklists: 124
- Missing total duration: 200
- Missing composer/songwriter/lyricist credits: 438
- Missing useful story/context: 173

## How to use this report

Use the highest-ranked missing albums as input for the next enrichment pass:

1. Prefer second-pass Discogs matching when tracklist and cover art are missing.
2. Prefer Cover Art Archive when only cover art is missing.
3. Prefer Wikipedia/Wikidata when story/context is missing.
4. Prefer deeper MusicBrainz work-credit enrichment when tracklists exist but composer/songwriter/lyricist credits are absent.

Keep source work internal. The public app should continue to show album content and quiet footnotes, not this gap report.

## Top missing profiles by latest Rolling Stone rank

1. The Beach Boys — *Pet Sounds* (1966)
   - latest rank #2
   - missing: composerCredits
   - recommended action: enrich-existing-tracklist-and-story

2. Joni Mitchell — *Blue* (1971)
   - latest rank #3
   - missing: composerCredits
   - recommended action: enrich-existing-tracklist-and-story

3. The Beatles — *Abbey Road* (1969)
   - latest rank #5
   - missing: totalDuration
   - recommended action: enrich-existing-tracklist-and-story

4. Nirvana — *Nevermind* (1991)
   - latest rank #6
   - missing: composerCredits
   - recommended action: enrich-existing-tracklist-and-story

5. The Clash — *London Calling* (1980)
   - latest rank #8
   - missing: story
   - recommended action: enrich-existing-tracklist-and-story

6. Bob Dylan — *Blood on the Tracks* (1975)
   - latest rank #9
   - missing: composerCredits
   - recommended action: enrich-existing-tracklist-and-story

7. The Beatles — *The Beatles ("The White Album")* (1968)
   - latest rank #10
   - missing: coverArt, tracklist, totalDuration, composerCredits, story
   - recommended action: fetch-album-content-sources

8. The Beatles — *The White Album* (1968)
   - latest rank #10
   - missing: coverArt, tracklist, totalDuration, composerCredits, story
   - recommended action: fetch-album-content-sources

9. Elvis Presley — *Sunrise* (1999)
   - latest rank #11
   - missing: composerCredits
   - recommended action: enrich-existing-tracklist-and-story

10. Elvis Presley — *The Sun Sessions* (1999)
   - latest rank #11
   - missing: coverArt, tracklist, totalDuration, composerCredits, story
   - recommended action: fetch-album-content-sources

11. The Beatles — *Revolver* (1966)
   - latest rank #11
   - missing: totalDuration, composerCredits
   - recommended action: enrich-existing-tracklist-and-story

12. The Velvet Underground and Nico — *The Velvet Underground* (1967)
   - latest rank #13
   - missing: story
   - recommended action: enrich-existing-tracklist-and-story

13. Public Enemy — *It Takes a Nation of Millions to Hold Us Back* (1988)
   - latest rank #15
   - missing: composerCredits
   - recommended action: enrich-existing-tracklist-and-story

14. Kanye West — *My Beautiful Dark Twisted Fantasy* (2010)
   - latest rank #17
   - missing: composerCredits
   - recommended action: enrich-existing-tracklist-and-story

15. Bob Dylan — *Highway 61 Revisited* (1965)
   - latest rank #18
   - missing: composerCredits
   - recommended action: enrich-existing-tracklist-and-story

16. Bruce Springsteen — *Born to Run* (1975)
   - latest rank #21
   - missing: composerCredits
   - recommended action: enrich-existing-tracklist-and-story

17. Robert Johnson — *The Complete Recordings* (1990)
   - latest rank #22
   - missing: story
   - recommended action: enrich-existing-tracklist-and-story

18. John Lennon — *John Lennon/Plastic Ono Band* (1970)
   - latest rank #23
   - missing: totalDuration, composerCredits
   - recommended action: enrich-existing-tracklist-and-story

19. Carole King — *Tapestry* (1971)
   - latest rank #25
   - missing: composerCredits
   - recommended action: enrich-existing-tracklist-and-story

20. D'Angelo — *Voodoo* (2000)
   - latest rank #28
   - missing: totalDuration
   - recommended action: enrich-existing-tracklist-and-story

21. The Beatles — *White Album* (1968)
   - latest rank #29
   - missing: coverArt, tracklist, totalDuration, composerCredits
   - recommended action: fetch-album-content-sources

22. Jimi Hendrix — *Are You Experienced* (1967)
   - latest rank #30
   - missing: totalDuration, composerCredits
   - recommended action: enrich-existing-tracklist-and-story

23. Miles Davis — *Kind of Blue* (1959)
   - latest rank #31
   - missing: composerCredits
   - recommended action: enrich-existing-tracklist-and-story

24. Stevie Wonder — *Innervisions* (1973)
   - latest rank #34
   - missing: composerCredits
   - recommended action: enrich-existing-tracklist-and-story

25. The Beatles — *Rubber Soul* (1965)
   - latest rank #35
   - missing: totalDuration, composerCredits
   - recommended action: enrich-existing-tracklist-and-story

26. Dr. Dre — *The Chronic* (1992)
   - latest rank #37
   - missing: story
   - recommended action: enrich-existing-tracklist-and-story

27. Bob Dylan — *Blonde on Blonde* (1966)
   - latest rank #38
   - missing: totalDuration, composerCredits
   - recommended action: enrich-existing-tracklist-and-story

28. Muddy Waters — *The Anthology (1947-1972)* (2001)
   - latest rank #38
   - missing: coverArt, tracklist, totalDuration, composerCredits, story
   - recommended action: fetch-album-content-sources

29. The Beatles — *Please Please Me* (1963)
   - latest rank #39
   - missing: totalDuration, composerCredits
   - recommended action: enrich-existing-tracklist-and-story

30. David Bowie — *The Rise and Fall of Ziggy Stardust and the Spiders From Mars* (1972)
   - latest rank #40
   - missing: composerCredits
   - recommended action: enrich-existing-tracklist-and-story

31. The Rolling Stones — *Let It Bleed* (1969)
   - latest rank #41
   - missing: totalDuration
   - recommended action: enrich-existing-tracklist-and-story

32. Radiohead — *OK Computer* (1997)
   - latest rank #42
   - missing: totalDuration, composerCredits
   - recommended action: enrich-existing-tracklist-and-story

33. John Coltrane — *A Love Supreme* (1964)
   - latest rank #47
   - missing: composerCredits
   - recommended action: enrich-existing-tracklist-and-story

34. Bob Marley and the Wailers — *Legend* (1984)
   - latest rank #48
   - missing: coverArt, tracklist, totalDuration, composerCredits
   - recommended action: fetch-album-content-sources

35. OutKast — *Aquemini* (1998)
   - latest rank #49
   - missing: composerCredits
   - recommended action: enrich-existing-tracklist-and-story

36. Jay-Z — *The Blueprint* (2001)
   - latest rank #50
   - missing: composerCredits
   - recommended action: enrich-existing-tracklist-and-story

37. David Bowie — *Station to Station* (1976)
   - latest rank #52
   - missing: composerCredits
   - recommended action: enrich-existing-tracklist-and-story

38. Jimi Hendrix — *Electric Ladyland* (1968)
   - latest rank #53
   - missing: totalDuration
   - recommended action: enrich-existing-tracklist-and-story

39. Pink Floyd — *The Dark Side of the Moon* (1973)
   - latest rank #55
   - missing: totalDuration, composerCredits
   - recommended action: enrich-existing-tracklist-and-story

40. Liz Phair — *Exile in Guyville* (1993)
   - latest rank #56
   - missing: composerCredits
   - recommended action: enrich-existing-tracklist-and-story

41. Creedence Clearwater Revival — *Chronicle, Vol. 1* (1976)
   - latest rank #59
   - missing: coverArt, tracklist, totalDuration, composerCredits
   - recommended action: fetch-album-content-sources

42. Captain Beefheart and his Magic Band — *Trout Mask Replica* (1969)
   - latest rank #60
   - missing: coverArt
   - recommended action: fetch-cover-art-source

43. Van Morrison — *Astral Weeks* (1968)
   - latest rank #60
   - missing: composerCredits
   - recommended action: enrich-existing-tracklist-and-story

44. James Brown — *Live at the Apollo* (1963)
   - latest rank #65
   - missing: totalDuration, composerCredits, story
   - recommended action: enrich-existing-tracklist-and-story

45. Phil Spector — *Back To Mono* (1991)
   - latest rank #65
   - missing: coverArt, tracklist, totalDuration, composerCredits
   - recommended action: fetch-album-content-sources

46. Phil Spector — *Back to Mono (1958-1969)* (1991)
   - latest rank #65
   - missing: coverArt, tracklist, totalDuration, composerCredits, story
   - recommended action: fetch-album-content-sources

47. John Coltrane — *A Love Supreme* (1965)
   - latest rank #66
   - missing: composerCredits
   - recommended action: enrich-existing-tracklist-and-story

48. Jay-Z — *Reasonable Doubt* (1996)
   - latest rank #67
   - missing: totalDuration
   - recommended action: enrich-existing-tracklist-and-story

49. Kate Bush — *Hounds of Love* (1985)
   - latest rank #68
   - missing: composerCredits
   - recommended action: enrich-existing-tracklist-and-story

50. Neil Young — *Harvest* (1972)
   - latest rank #72
   - missing: composerCredits
   - recommended action: enrich-existing-tracklist-and-story
