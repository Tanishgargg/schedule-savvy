import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Clock } from "lucide-react";
// 1. Change this import
import { getPublicProfile } from "@/services/api";

interface EventType {
    id: number;
    title: string;
    description: string;
    duration: number;
    slug: string;
}

interface PublicProfileData {
    id: number;
    name: string;
    username: string;
    event_types: EventType[]; // Note: Backend returns snake_case 'event_types'
}

export default function PublicProfile() {
    const { username } = useParams<{ username: string }>();
    const [profile, setProfile] = useState<PublicProfileData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                // 2. Use the new named API function
                const data = await getPublicProfile(username as string);
                setProfile(data);
            } catch (err: any) {
                setError(err.message || "User not found");
            } finally {
                setLoading(false);
            }
        };

        if (username) fetchProfile();
    }, [username]);

    if (loading) return <div className="flex h-screen items-center justify-center">Loading...</div>;
    if (error || !profile) return <div className="flex h-screen items-center justify-center text-gray-500">{error}</div>;

    return (
        <div className="min-h-screen bg-gray-50/50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl">
                {/* User Header */}
                <div className="mb-8 text-center">
                    <Avatar className="mx-auto h-20 w-20 mb-4 border-2 border-white shadow-sm">
                        <AvatarImage src={`https://avatar.vercel.sh/${profile.username}.svg`} alt={profile.name} />
                        <AvatarFallback>{profile.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <h1 className="text-2xl font-semibold text-gray-900">{profile.name}</h1>
                    <p className="text-gray-500 mt-1">cal.com/{profile.username}</p>
                </div>

                {/* Event Types List */}
                <div className="grid gap-4 md:grid-cols-2">
                    {/* 3. Map over the correctly typed event_types array */}
                    {profile.event_types?.map((eventType) => (
                        <Link key={eventType.id} to={`/${profile.username}/${eventType.slug}`}>
                            <Card className="group cursor-pointer transition-all hover:border-black hover:shadow-md">
                                <CardContent className="p-6">
                                    <h3 className="font-semibold text-gray-900 group-hover:text-black">
                                        {eventType.title}
                                    </h3>
                                    <div className="mt-2 flex items-center text-sm text-gray-500">
                                        <Clock className="mr-1.5 h-4 w-4" />
                                        {eventType.duration}m
                                    </div>
                                    {eventType.description && (
                                        <p className="mt-3 text-sm text-gray-600 line-clamp-2">
                                            {eventType.description}
                                        </p>
                                    )}
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                    {(!profile.event_types || profile.event_types.length === 0) && (
                        <div className="col-span-full text-center text-gray-500 py-8">
                            No active event types found.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}