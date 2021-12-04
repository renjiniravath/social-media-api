export const sortByVotes = (a, b) => {
    return b.votes.count - a.votes.count
}
