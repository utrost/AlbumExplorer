# Album profile gaps

Status: generated internal enrichment report, not public app content.

This report is derived from `data/app/album-atlas.json` and drives the next content-first enrichment passes. It should help Hermes choose which album profiles need better cover art, stories, tracklists, durations, and composer/songwriter/lyricist credits.

## Summary

- Albums: 760
- Albums with at least one profile gap: 664
- Missing cover art: 128
- Missing tracklists: 124
- Missing total duration: 200
- Missing composer/songwriter/lyricist credits: 515
- Missing useful story/context: 499

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

5. Prince and the Revolution — *Purple Rain* (1984)
   - latest rank #8
   - missing: story
   - recommended action: enrich-existing-tracklist-and-story

6. The Clash — *London Calling* (1980)
   - latest rank #8
   - missing: story
   - recommended action: enrich-existing-tracklist-and-story

7. Bob Dylan — *Blood on the Tracks* (1975)
   - latest rank #9
   - missing: composerCredits
   - recommended action: enrich-existing-tracklist-and-story

8. The Beatles — *The Beatles ("The White Album")* (1968)
   - latest rank #10
   - missing: coverArt, tracklist, totalDuration, composerCredits, story
   - recommended action: fetch-album-content-sources

9. The Beatles — *The White Album* (1968)
   - latest rank #10
   - missing: coverArt, tracklist, totalDuration, composerCredits, story
   - recommended action: fetch-album-content-sources

10. Elvis Presley — *Sunrise* (1999)
   - latest rank #11
   - missing: composerCredits
   - recommended action: enrich-existing-tracklist-and-story

11. Elvis Presley — *The Sun Sessions* (1999)
   - latest rank #11
   - missing: coverArt, tracklist, totalDuration, composerCredits, story
   - recommended action: fetch-album-content-sources

12. The Beatles — *Revolver* (1966)
   - latest rank #11
   - missing: totalDuration, composerCredits
   - recommended action: enrich-existing-tracklist-and-story

13. The Velvet Underground and Nico — *The Velvet Underground* (1967)
   - latest rank #13
   - missing: story
   - recommended action: enrich-existing-tracklist-and-story

14. The Rolling Stones — *Exile on Main Street* (1972)
   - latest rank #14
   - missing: story
   - recommended action: enrich-existing-tracklist-and-story

15. Public Enemy — *It Takes a Nation of Millions to Hold Us Back* (1988)
   - latest rank #15
   - missing: composerCredits
   - recommended action: enrich-existing-tracklist-and-story

16. The Clash — *London Calling* (1979)
   - latest rank #16
   - missing: story
   - recommended action: enrich-existing-tracklist-and-story

17. Kanye West — *My Beautiful Dark Twisted Fantasy* (2010)
   - latest rank #17
   - missing: composerCredits
   - recommended action: enrich-existing-tracklist-and-story

18. Bob Dylan — *Highway 61 Revisited* (1965)
   - latest rank #18
   - missing: composerCredits
   - recommended action: enrich-existing-tracklist-and-story

19. Bruce Springsteen — *Born to Run* (1975)
   - latest rank #21
   - missing: composerCredits
   - recommended action: enrich-existing-tracklist-and-story

20. Robert Johnson — *The Complete Recordings* (1990)
   - latest rank #22
   - missing: story
   - recommended action: enrich-existing-tracklist-and-story

21. The Notorious B.I.G. — *Ready to Die* (1994)
   - latest rank #22
   - missing: composerCredits
   - recommended action: enrich-existing-tracklist-and-story

22. John Lennon — *John Lennon/Plastic Ono Band* (1970)
   - latest rank #23
   - missing: totalDuration, composerCredits
   - recommended action: enrich-existing-tracklist-and-story

23. The Beatles — *Sgt. Pepper's Lonely Hearts Club Band* (1967)
   - latest rank #24
   - missing: composerCredits
   - recommended action: enrich-existing-tracklist-and-story

24. Carole King — *Tapestry* (1971)
   - latest rank #25
   - missing: composerCredits
   - recommended action: enrich-existing-tracklist-and-story

25. D'Angelo — *Voodoo* (2000)
   - latest rank #28
   - missing: totalDuration
   - recommended action: enrich-existing-tracklist-and-story

26. The Beatles — *White Album* (1968)
   - latest rank #29
   - missing: coverArt, tracklist, totalDuration, composerCredits, story
   - recommended action: fetch-album-content-sources

27. Jimi Hendrix — *Are You Experienced* (1967)
   - latest rank #30
   - missing: totalDuration, composerCredits, story
   - recommended action: enrich-existing-tracklist-and-story

28. Miles Davis — *Kind of Blue* (1959)
   - latest rank #31
   - missing: composerCredits
   - recommended action: enrich-existing-tracklist-and-story

29. Amy Winehouse — *Back to Black* (2006)
   - latest rank #33
   - missing: composerCredits
   - recommended action: enrich-existing-tracklist-and-story

30. Stevie Wonder — *Innervisions* (1973)
   - latest rank #34
   - missing: composerCredits
   - recommended action: enrich-existing-tracklist-and-story

31. The Beatles — *Rubber Soul* (1965)
   - latest rank #35
   - missing: totalDuration, composerCredits
   - recommended action: enrich-existing-tracklist-and-story

32. Dr. Dre — *The Chronic* (1992)
   - latest rank #37
   - missing: story
   - recommended action: enrich-existing-tracklist-and-story

33. Bob Dylan — *Blonde on Blonde* (1966)
   - latest rank #38
   - missing: totalDuration, composerCredits
   - recommended action: enrich-existing-tracklist-and-story

34. Muddy Waters — *The Anthology (1947-1972)* (2001)
   - latest rank #38
   - missing: coverArt, tracklist, totalDuration, composerCredits, story
   - recommended action: fetch-album-content-sources

35. The Beatles — *Please Please Me* (1963)
   - latest rank #39
   - missing: totalDuration, composerCredits
   - recommended action: enrich-existing-tracklist-and-story

36. David Bowie — *The Rise and Fall of Ziggy Stardust and the Spiders From Mars* (1972)
   - latest rank #40
   - missing: composerCredits
   - recommended action: enrich-existing-tracklist-and-story

37. The Rolling Stones — *Let It Bleed* (1969)
   - latest rank #41
   - missing: totalDuration
   - recommended action: enrich-existing-tracklist-and-story

38. Radiohead — *OK Computer* (1997)
   - latest rank #42
   - missing: totalDuration, composerCredits
   - recommended action: enrich-existing-tracklist-and-story

39. Prince — *Sign O' the Times* (1987)
   - latest rank #45
   - missing: story
   - recommended action: enrich-existing-tracklist-and-story

40. Paul Simon — *Graceland* (1986)
   - latest rank #46
   - missing: composerCredits
   - recommended action: enrich-existing-tracklist-and-story

41. John Coltrane — *A Love Supreme* (1964)
   - latest rank #47
   - missing: composerCredits, story
   - recommended action: enrich-existing-tracklist-and-story

42. Bob Marley and the Wailers — *Exodus* (1977)
   - latest rank #48
   - missing: composerCredits
   - recommended action: enrich-existing-tracklist-and-story

43. Bob Marley and the Wailers — *Legend* (1984)
   - latest rank #48
   - missing: coverArt, tracklist, totalDuration, composerCredits, story
   - recommended action: fetch-album-content-sources

44. OutKast — *Aquemini* (1998)
   - latest rank #49
   - missing: composerCredits
   - recommended action: enrich-existing-tracklist-and-story

45. Jay-Z — *The Blueprint* (2001)
   - latest rank #50
   - missing: composerCredits
   - recommended action: enrich-existing-tracklist-and-story

46. David Bowie — *Station to Station* (1976)
   - latest rank #52
   - missing: composerCredits
   - recommended action: enrich-existing-tracklist-and-story

47. Jimi Hendrix — *Electric Ladyland* (1968)
   - latest rank #53
   - missing: totalDuration, story
   - recommended action: enrich-existing-tracklist-and-story

48. James Brown — *Star Time* (1991)
   - latest rank #54
   - missing: story
   - recommended action: enrich-existing-tracklist-and-story

49. Pink Floyd — *The Dark Side of the Moon* (1973)
   - latest rank #55
   - missing: totalDuration, composerCredits
   - recommended action: enrich-existing-tracklist-and-story

50. Liz Phair — *Exile in Guyville* (1993)
   - latest rank #56
   - missing: composerCredits
   - recommended action: enrich-existing-tracklist-and-story
